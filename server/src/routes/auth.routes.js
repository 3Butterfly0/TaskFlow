import { Router } from "express";
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  setupMfa,
  verifyMfa,
  disableMfa,
  validateMfa,
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/mfa/validate", validateMfa);

// Protected routes
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.patch("/password", protect, changePassword);

// MFA Routes
router.post("/mfa/setup", protect, setupMfa);
router.post("/mfa/verify", protect, verifyMfa);
router.post("/mfa/disable", protect, disableMfa);

// TODO: Google OAuth routes (Phase 2+)
// GET /api/auth/google
// GET /api/auth/google/callback

export default router;
