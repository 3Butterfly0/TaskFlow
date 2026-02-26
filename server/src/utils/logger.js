import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, errors } = format;

/**
 * Custom log format:
 *   2026-02-11 15:05:00 [INFO]: Server started on port 5000
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat,
  ),
  defaultMeta: { service: "taskflow-server" },
  transports: [
    // ── Console (always) ─────────────────────────────
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),

    // ── File: errors ─────────────────────────────────
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
    }),

    // ── File: combined ───────────────────────────────
    new transports.File({
      filename: "logs/combined.log",
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
});

export default logger;
