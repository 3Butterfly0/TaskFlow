import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
} from "../controllers/project.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// All project routes are protected
router.use(protect);

// ── Project routes ───────────────────────────────────
router.post("/", createProject);
router.get("/", getProjects);
router.get("/:id", getProjectById);

export default router;
