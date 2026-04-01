import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

// Protect middleware – verifies JWT from HttpOnly cookie
const protect = async (req, _res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      throw new ApiError(401, "Not authenticated – no token provided");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };

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
