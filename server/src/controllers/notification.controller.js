import Notification from "../models/Notification.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

// GET /api/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "username avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Notification.countDocuments({ recipient: userId });
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json(
      new ApiResponse(
        200,
        {
          notifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
          },
          unreadCount,
        },
        "Notifications fetched successfully",
      ),
    );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Mark single notification or all as read
    let notification;
    if (id === "all") {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true },
      );
      notification = { message: "All notifications marked as read" };
    } else {
      notification = await Notification.findOneAndUpdate(
        { _id: id, recipient: userId },
        { isRead: true },
        { new: true },
      );
      if (!notification) {
        throw new ApiError(404, "Notification not found");
      }
    }

    res.status(200).json(new ApiResponse(200, notification, "Marked as read"));
  } catch (error) {
    next(error);
  }
};

// Internal helper to create a notification
export const createNotification = async ({
  recipient,
  sender,
  type,
  resourceId,
  resourceType,
  message,
}) => {
  try {
    if (String(recipient) === String(sender)) return; // Don't notify self

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      resourceId,
      resourceType,
      message,
    });
    return notification;
  } catch (error) {
    logger.error("Failed to create notification:", error);
  }
};
