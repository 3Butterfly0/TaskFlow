import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";

// Protect middleware – verifies JWT from HttpOnly cookie
const protect = async (req, _res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new ApiError(401, "Not authenticated – no token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user with only needed fields to avoid data leak
    const user = await User.findById(decoded.id).select(
      "username email role pinnedProjects lastAccessedProjects",
    );
    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = user; // Safe user object

    next();
  } catch (error) {
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
