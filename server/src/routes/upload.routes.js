import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/upload.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Memory storage for streams
const storage = multer.memoryStorage();

// Multer config (5MB limit, all file types)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Protect route with auth middleware
router.post("/", protect, upload.single("file"), uploadFile);

export default router;
