import { Router } from "express";
import {
  getMembers,
  addMember,
  removeMember,
  transferOwnership,
} from "../controllers/team.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

// All team routes are protected
router.use(protect);

// ── Team routes ──────────────────────────────────────
router.get("/", getMembers);
router.post("/", addMember);
router.delete("/:memberId", removeMember);
router.patch("/:memberId/role", transferOwnership);

export default router;
