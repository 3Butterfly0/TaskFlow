import express from "express";
import multer from "multer";
import { uploadFile } from "../controllers/upload.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

// Memory storage for streams
const storage = multer.memoryStorage();

// Multer config (5MB limit, restricted file types)
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

// Protect route with auth middleware
router.post("/", protect, upload.single("file"), (req, res, next) => {
  // Use a wrapper to handle multer errors manually if needed, or let global handler catch it
  uploadFile(req, res, next);
});

export default router;
