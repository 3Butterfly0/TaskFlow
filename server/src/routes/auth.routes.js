import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public routes ────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// ── Protected routes ─────────────────────────────────
router.get("/me", protect, getMe);

// TODO: Google OAuth routes (Phase 2+)
// GET /api/auth/google
// GET /api/auth/google/callback

export default router;
