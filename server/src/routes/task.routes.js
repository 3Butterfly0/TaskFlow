import { Router } from "express";
import {
  getTasksByProject,
  createTask,
  updateTask,
  reorderInsideColumn,
  moveAcrossColumns,
} from "../controllers/task.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// All task routes are protected
router.use(protect);

// ── Board data ───────────────────────────────────────
router.get("/", getTasksByProject);

// ── Board ordering (must be before /:id) ─────────────
router.patch("/reorder", reorderInsideColumn);
router.patch("/move", moveAcrossColumns);

// ── Task CRUD ────────────────────────────────────────
router.post("/", createTask);
router.patch("/:id", updateTask);

export default router;
