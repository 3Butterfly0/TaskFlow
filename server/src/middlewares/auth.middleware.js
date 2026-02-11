import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

/**
 * Protect middleware – verifies JWT from HttpOnly cookie.
 *
 * On success, attaches `req.user = { id }` for downstream handlers.
 * On failure, throws 401 via ApiError (caught by global error handler).
 */
const protect = async (req, _res, next) => {
  try {
    // ── Extract token from cookie ─────────────────────
    const token = req.cookies?.token;

    if (!token) {
      throw new ApiError(401, "Not authenticated – no token provided");
    }

    // ── Verify token ──────────────────────────────────
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach minimal user payload to request
    req.user = { id: decoded.id };

    next();
  } catch (error) {
    // Handle specific JWT errors with clear messages
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired – please log in again"));
    }

    next(error);
  }
};

export default protect;
