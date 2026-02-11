import morgan from "morgan";
import logger from "../utils/logger.js";

/**
 * HTTP request logger middleware.
 *
 * Uses morgan for structured request logging, piped through winston
 * so all output goes through the same transport (console + files).
 *
 * Format:
 *   :method :url :status :response-time ms
 */
const stream = {
  write: (message) => {
    // Remove trailing newline that morgan adds
    logger.http(message.trim());
  },
};

/**
 * Skip logging in test environments to keep test output clean.
 */
const skip = () => {
  return process.env.NODE_ENV === "test";
};

const requestLogger = morgan("combined", { stream, skip });

export default requestLogger;
