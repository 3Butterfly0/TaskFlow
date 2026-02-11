import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

/**
 * Bootstrap sequence:
 *   1. Connect to MongoDB
 *   2. Start Express server
 *
 * Uncaught exceptions and unhandled rejections are logged and cause
 * a graceful shutdown so the process manager can restart the service.
 */
const startServer = async () => {
  // 1. Database
  await connectDB();

  // 2. HTTP server
  const server = app.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });

  // ── Graceful shutdown helpers ──────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received – shutting down gracefully…`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

// ── Safety nets ───────────────────────────────────────
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION – shutting down…", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("UNHANDLED REJECTION – shutting down…", reason);
  process.exit(1);
});

startServer();
