/**
 * Custom operational error class.
 * Thrown intentionally from controllers / services and caught by the
 * global error handler middleware.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  – HTTP status code (e.g. 400, 404, 500)
   * @param {string} message     – Human-readable error description
   * @param {Array}  errors      – Optional array of detailed validation errors
   * @param {string} stack       – Optional stack trace override
   */
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "",
  ) {
    super(message);

    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;
    this.data = null;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
