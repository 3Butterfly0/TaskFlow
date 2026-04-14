import express from "express";
import mongoose from "mongoose";
import Activity from "../models/Activity.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

// GET /api/activities?projectId=xxx
router.get("/", async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = rawLimit > 0 ? Math.min(rawLimit, 100) : 50;

    const query = {};
    if (projectId) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ success: false, message: "Invalid projectId" });
      }
      query.projectId = projectId;
    }

    const activities = await Activity.find(query)
      .populate("actorId", "username avatar")
      .sort({ createdAt: -1 })
      .limit(limit);
    res.status(200).json(new ApiResponse(200, activities, "Activities fetched successfully"));
  } catch (err) {
    next(err);
  }
});

export default router;
