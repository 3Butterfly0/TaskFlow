import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import requestLogger from "./middlewares/logger.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import ApiError from "./utils/ApiError.js";

// ── Route imports ────────────────────────────────────
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import teamRoutes from "./routes/team.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import searchRoutes from "./routes/search.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

/**
 * Express application factory.
 *
 * Wires up:
 *   1. Global middleware (CORS, JSON parsing, cookies, request logging)
 *   2. API routes
 *   3. 404 catch-all
 *   4. Global error handler
 */
const app = express();

// ── Global Middleware ────────────────────────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(requestLogger);

// ── Health Check ─────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    message: "Server is healthy",
  });
});

// ── API Routes ───────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/projects/:projectId/members", teamRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// ── 404 Catch-All ────────────────────────────────────
app.all("*", (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
});

// ── Global Error Handler (must be last) ──────────────
app.use(errorHandler);

export default app;
