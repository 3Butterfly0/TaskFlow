import express from "express";
import * as NotificationController from "../controllers/notification.controller.js";
import protect from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", NotificationController.getNotifications);
router.patch("/:id/read", NotificationController.markAsRead);

export default router;
