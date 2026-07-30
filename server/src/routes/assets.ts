import { Router } from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import path from "path";
import { s3, BUCKET } from "../config/s3";
import Asset from "../models/Asset";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = Router();

// Configure multer file validation (extension + MIME type fallback)
const allowedExtensions = [".pdf", ".dwg", ".dxf", ".jpg", ".jpeg", ".png"];

const upload = multer({
  storage: multerS3({
    s3,
    bucket: BUCKET!,
    key: (req: any, file: any, cb: any) => {
      // Create a clean unique key in S3 under assets/
      const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
      cb(null, `assets/${Date.now()}-${sanitizedName}`);
    },
  }),
  limits: { fileSize: 25 * 1024 * 1024 }, // Limit file size to 25MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed file types are: ${allowedExtensions.join(", ")}`));
    }
  },
});

// GET assets (filtered by projectId and optionally roomId)
router.get("/", async (req, res, next) => {
  try {
    const { projectId, roomId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: { message: "projectId is required", status: 400 } });
    }

    const filter: Record<string, any> = { projectId };
    if (roomId) {
      filter.roomId = roomId === "null" || roomId === "" ? null : roomId;
    }

    const assets = await Asset.find(filter).sort({ createdAt: -1 });

    // Generate short-lived signed URLs for secure access
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET!,
            Key: asset.s3Key,
          });
          const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // Valid for 1 hour
          return {
            ...asset.toObject(),
            url: signedUrl, // Override raw URL with secure signed URL
          };
        } catch (s3Err) {
          console.error(`Error generating signed URL for key ${asset.s3Key}:`, s3Err);
          return asset.toObject();
        }
      })
    );

    res.json(assetsWithUrls);
  } catch (err) {
    next(err);
  }
});

// POST upload file to S3 and save to Database
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file as any;
    if (!file) {
      return res.status(400).json({ error: { message: "No file was uploaded or file type is invalid", status: 400 } });
    }

    const { projectId, roomId } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: { message: "projectId is required", status: 400 } });
    }

    const asset = await Asset.create({
      projectId,
      roomId: roomId && roomId !== "null" && roomId !== "" ? roomId : null,
      fileName: file.originalname,
      fileType: file.mimetype || path.extname(file.originalname).substring(1), // Fallback to file extension
      fileSize: file.size,
      s3Key: file.key,
      url: file.location || "", // Keep the direct URL in database, but we will always return a signed URL in GET
    });

    res.status(201).json(asset);
  } catch (err) {
    next(err);
  }
});

// DELETE asset (from S3 and Database)
router.delete("/:id", async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: { message: "Asset not found", status: 404 } });
    }

    // Delete from S3 bucket
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET!, Key: asset.s3Key }));
    } catch (s3Err) {
      console.error(`Warning: Failed to delete S3 object for key ${asset.s3Key}:`, s3Err);
    }

    // Delete from Database
    await asset.deleteOne();

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
