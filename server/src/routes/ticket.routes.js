import { Router } from "express";
import {
  createTicket,
  getTickets,
  promoteToTask,
} from "../controllers/ticket.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// All ticket routes are protected
router.use(protect);

// ── Ticket routes ────────────────────────────────────
router.post("/", createTicket);
router.get("/", getTickets);
router.post("/:id/promote", promoteToTask);

export default router;
