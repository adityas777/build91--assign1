import { Router } from "express";
import Room from "../models/Room";
import Asset from "../models/Asset";
import { s3, BUCKET } from "../config/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = Router();

// GET rooms (filter by projectId)
router.get("/", async (req, res, next) => {
  try {
    const { projectId } = req.query;
    if (!projectId) {
      return res.status(400).json({ error: { message: "projectId is required", status: 400 } });
    }
    const rooms = await Room.find({ projectId }).sort({ createdAt: 1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
});

// GET room by ID
router.get("/:id", async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: { message: "Room not found", status: 404 } });
    }
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// POST create room
router.post("/", async (req, res, next) => {
  try {
    const { projectId, name, assignedArtist, targetDeliveryDate, stage, progress, reviewerComments } = req.body;
    if (!projectId || !name) {
      return res.status(400).json({ error: { message: "projectId and name are required", status: 400 } });
    }

    const room = await Room.create({
      projectId,
      name,
      assignedArtist,
      targetDeliveryDate: targetDeliveryDate || undefined,
      stage,
      progress,
      reviewerComments,
    });
    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
});

// PUT update room
router.put("/:id", async (req, res, next) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!room) {
      return res.status(404).json({ error: { message: "Room not found", status: 404 } });
    }
    res.json(room);
  } catch (err) {
    next(err);
  }
});

// DELETE room (cascades asset deletions)
router.delete("/:id", async (req, res, next) => {
  try {
    const roomId = req.params.id;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: { message: "Room not found", status: 404 } });
    }

    // Delete all assets belonging to this room from S3 and MongoDB
    const assets = await Asset.find({ roomId });
    for (const asset of assets) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET!, Key: asset.s3Key }));
      } catch (s3Err) {
        console.error(`Warning: Failed to delete S3 object for key ${asset.s3Key}:`, s3Err);
      }
      await asset.deleteOne();
    }

    // Delete the room
    await room.deleteOne();
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
