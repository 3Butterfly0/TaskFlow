import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initializeSocket } from "./config/socket.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

/**
 * Bootstrap sequence:
 *   1. Connect to MongoDB
 *   2. Create HTTP server (shared by Express + Socket.io)
 *   3. Initialize Socket.io on the HTTP server
 *   4. Start listening
 *
 * Uncaught exceptions and unhandled rejections are logged and cause
 * a graceful shutdown so the process manager can restart the service.
 */
const startServer = async () => {
  // 0. Environment Check
  const requiredEnvVars = ["JWT_SECRET", "MONGO_URI", "CLIENT_URL"];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar],
  );
  if (missingEnvVars.length > 0) {
    logger.error(
      `FATAL EXCEPTION: Missing critical environment variables: ${missingEnvVars.join(
        ", ",
      )}\nServer cannot start.`,
    );
    process.exit(1);
  }

  // 1. Database
  await connectDB();

  // 2. HTTP server (wraps Express app so Socket.io can share the same port)
  const httpServer = createServer(app);

  // 3. Socket.io
  initializeSocket(httpServer);

  // 4. Listen
  httpServer.listen(PORT, "0.0.0.0", () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
    );
  });

  // ── Graceful shutdown helpers ──────────────────────
  const shutdown = (signal) => {
    logger.info(`${signal} received – shutting down gracefully…`);
    httpServer.close(() => {
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
