import morgan from "morgan";
import logger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Filter sensitive headers from the logger output.
 */
morgan.token("request-id", (req) => req.id);

/**
 * HTTP request logger middleware.
 */
const stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

const skip = () => {
  return process.env.NODE_ENV === "test";
};

/**
 * Custom Morgan format for production:
 * Includes request-ID and excludes sensitive data (tokens/cookies).
 */
const logFormat = process.env.NODE_ENV === "production"
  ? ":remote-addr - :remote-user [:date[clf]] \":method :url HTTP/:http-version\" :status :res[content-length] \":referrer\" \":user-agent\" :request-id"
  : ":method :url :status :response-time ms - :request-id";

const morgMiddleware = morgan(logFormat, { stream, skip });

/**
 * Combined middleware that adds request ID and logs the request.
 */
const requestLogger = (req, res, next) => {
  req.id = req.headers["x-request-id"] || uuidv4();
  res.setHeader("x-request-id", req.id);
  
  morgMiddleware(req, res, next);
};

export default requestLogger;
