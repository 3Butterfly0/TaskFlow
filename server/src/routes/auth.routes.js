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
  googleLogin,
} from "../controllers/auth.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// ── Public routes ────────────────────────────────────
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/mfa/validate", validateMfa);

// ── Protected routes ─────────────────────────────────
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfile);
router.patch("/password", protect, changePassword);

// MFA Routes
router.post("/mfa/setup", protect, setupMfa);
router.post("/mfa/verify", protect, verifyMfa);
router.post("/mfa/disable", protect, disableMfa);

// Google OAuth route
router.post("/google", googleLogin);

export default router;
