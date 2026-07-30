import { Router } from "express";
import Project from "../models/Project";
import Room from "../models/Room";
import Asset from "../models/Asset";

const router = Router();

// GET dashboard summaries
router.get("/summary", async (req, res, next) => {
  try {
    // 1. Projects by status counts
    const projectStatusCounts = await Project.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Format status counts cleanly
    const statuses = ["Submitted", "Approved", "In Progress", "Review", "Done"];
    const statusSummary: Record<string, number> = {};
    statuses.forEach(s => { statusSummary[s] = 0; });
    projectStatusCounts.forEach(item => {
      if (item._id) {
        statusSummary[item._id] = item.count;
      }
    });

    // 2. Room stages counts & average progress
    const roomsStats = await Room.aggregate([
      {
        $group: {
          _id: null,
          avgProgress: { $avg: "$progress" },
          totalRooms: { $sum: 1 }
        }
      }
    ]);

    const roomStages = await Room.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);

    const stages = ["Modeling", "Internal Review", "Rendering", "QA Review", "Final Renders", "Completed"];
    const stageSummary: Record<string, number> = {};
    stages.forEach(st => { stageSummary[st] = 0; });
    roomStages.forEach(item => {
      if (item._id) {
        stageSummary[item._id] = item.count;
      }
    });

    // 3. Overall counts
    const totalProjects = await Project.countDocuments();
    const totalRooms = roomsStats[0]?.totalRooms || 0;
    const avgRoomProgress = Math.round(roomsStats[0]?.avgProgress || 0);
    const totalAssets = await Asset.countDocuments();

    // 4. Quick list of active projects (In Progress / Review)
    const activeProjects = await Project.find({
      status: { $in: ["In Progress", "Review", "Approved"] }
    })
      .sort({ updatedAt: -1 })
      .limit(5);

    res.json({
      projects: {
        total: totalProjects,
        byStatus: statusSummary
      },
      rooms: {
        total: totalRooms,
        byStage: stageSummary,
        averageProgress: avgRoomProgress
      },
      totalAssets,
      activeProjects
    });
  } catch (err) {
    next(err);
  }
});

export default router;
