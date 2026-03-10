import { Router } from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
  togglePinProject,
  updateLastAccessed,
  getProjectMembers,
  addColumn,
  updateProject,
  transferOwnership,
  renameColumn,
  deleteColumn,
} from "../controllers/project.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// All project routes are protected
router.use(protect);

// ── Project routes ───────────────────────────────────
router.post("/", createProject);
router.get("/", getProjects);

router.get("/:id", getProjectById);
router.patch("/:id", updateProject);
router.delete("/:id", deleteProject);
router.patch("/:id/transfer", transferOwnership);
router.post("/:id/pin", togglePinProject);
router.post("/:id/access", updateLastAccessed);
// router.get("/:id/members", getProjectMembers); // Moved to team.routes.js
router.post("/:id/columns", addColumn);
router.patch("/:id/columns/:columnId", renameColumn);
router.delete("/:id/columns/:columnId", deleteColumn);

export default router;
