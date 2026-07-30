import { Router } from "express";
import Project from "../models/Project";
import Room from "../models/Room";
import Asset from "../models/Asset";
import { s3, BUCKET } from "../config/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

const router = Router();

// GET all projects (with filtering)
router.get("/", async (req, res, next) => {
  try {
    const { status, client, search } = req.query;
    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }
    if (client) {
      filter.client = new RegExp(String(client), "i");
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(String(search), "i") },
        { client: new RegExp(String(search), "i") }
      ];
    }

    const projects = await Project.find(filter).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET individual project detail
router.get("/:id", async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: { message: "Project not found", status: 404 } });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// POST new project
router.post("/", async (req, res, next) => {
  try {
    const { name, client, status, startDate, targetDate } = req.body;
    if (!name || !client) {
      return res.status(400).json({ error: { message: "Name and client are required", status: 400 } });
    }

    if (startDate && targetDate) {
      const start = new Date(startDate);
      const target = new Date(targetDate);
      if (target < start) {
        return res.status(400).json({ error: { message: "Target date cannot be before start date", status: 400 } });
      }
    }

    const project = await Project.create({
      name,
      client,
      status,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// PUT update project
router.put("/:id", async (req, res, next) => {
  try {
    const existingProject = await Project.findById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ error: { message: "Project not found", status: 404 } });
    }

    const mergedStartDate = req.body.startDate !== undefined ? req.body.startDate : existingProject.startDate;
    const mergedTargetDate = req.body.targetDate !== undefined ? req.body.targetDate : existingProject.targetDate;

    if (mergedStartDate && mergedTargetDate) {
      const start = new Date(mergedStartDate);
      const target = new Date(mergedTargetDate);
      if (target < start) {
        return res.status(400).json({ error: { message: "Target date cannot be before start date", status: 400 } });
      }
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE project (performs clean-up of rooms and S3 assets)
router.delete("/:id", async (req, res, next) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: { message: "Project not found", status: 404 } });
    }

    // Find and delete all assets from S3 and MongoDB
    const assets = await Asset.find({ projectId });
    for (const asset of assets) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET!, Key: asset.s3Key }));
      } catch (s3Err) {
        console.error(`Warning: Failed to delete S3 object for key ${asset.s3Key}:`, s3Err);
      }
      await asset.deleteOne();
    }

    // Delete all rooms associated with this project
    await Room.deleteMany({ projectId });

    // Finally, delete the project
    await project.deleteOne();
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
