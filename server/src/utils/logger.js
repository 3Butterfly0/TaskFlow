import { createLogger, format, transports } from "winston";

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack, requestId }) => {
  return `${timestamp} [${level}]${requestId ? ` [${requestId}]` : ""}: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    process.env.NODE_ENV === "production" ? format.json() : logFormat,
  ),
  defaultMeta: { service: "taskflow-server" },
  transports: [
    // Console output
    new transports.Console({
      format: combine(
        colorize({ all: process.env.NODE_ENV !== "production" }),
        process.env.NODE_ENV === "production" ? format.json() : logFormat,
      ),
    }),

    // Error log file
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5_242_880, // 5 MB
      maxFiles: 5,
    }),

    // Combined log file
    new transports.File({
      filename: "logs/combined.log",
      maxsize: 5_242_880,
      maxFiles: 5,
    }),
  ],
});

export default logger;
