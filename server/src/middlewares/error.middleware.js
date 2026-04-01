import ApiError from "../utils/ApiError.js";
import logger from "../utils/logger.js";

/**
 * Global error-handling middleware.
 * Catches all errors and returns a consistent JSON envelope.
 * Stack traces are only exposed in development.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue).join(", ");
    message = `Duplicate value for field(s): ${field}`;
  }

  // Mongoose: validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join(". ");
  }

  logger.error(err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: statusCode,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

export default errorHandler;
