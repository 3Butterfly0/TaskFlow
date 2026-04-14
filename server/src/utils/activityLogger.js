import Activity from "../models/Activity.model.js";
import logger from "./logger.js";

/**
 * Log an activity event to the Activity collection.
 * Failures are swallowed so they never break the main request flow.
 */
export const logActivity = async ({ action, actorId, entityType, entityId, projectId, details = null }) => {
  try {
    await Activity.create({ action, actorId, entityType, entityId, projectId, details });
  } catch (err) {
    logger.error("Failed to log activity:", err);
  }
};
