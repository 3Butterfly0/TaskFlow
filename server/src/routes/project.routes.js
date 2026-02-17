import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
  togglePinProject,
  updateLastAccessed,
} from "../controllers/project.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// All project routes are protected
router.use(protect);

// ── Project routes ───────────────────────────────────
router.post("/", createProject);
router.get("/", getProjects);

router.get("/:id", getProjectById);
router.delete("/:id", deleteProject);
router.post("/:id/pin", togglePinProject);
router.post("/:id/access", updateLastAccessed);

export default router;
