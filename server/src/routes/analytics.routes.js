import express from "express";
import * as AnalyticsController from "../controllers/analytics.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/:projectId", AnalyticsController.getProjectAnalytics);

export default router;
