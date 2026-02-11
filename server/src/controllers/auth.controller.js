import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";

// ── Helper: generate token & set HttpOnly cookie ──────
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// ──────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // ── Validation ────────────────────────────────────
    if (!username || !email || !password) {
      throw new ApiError(400, "Please provide username, email, and password");
    }

    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    // ── Check for existing user ───────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "A user with this email already exists");
    }

    // ── Create user (password hashed via pre-save hook)
    const user = await User.create({ username, email, password });

    // ── Issue token ───────────────────────────────────
    generateTokenAndSetCookie(res, user._id);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          user.toSafeObject(),
          "User registered successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // ── Validation ────────────────────────────────────
    if (!email || !password) {
      throw new ApiError(400, "Please provide email and password");
    }

    // ── Find user (include password for comparison) ───
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    // ── Verify password ───────────────────────────────
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    // ── Update lastSeen ───────────────────────────────
    user.lastSeen = new Date();
    await user.save({ validateModifiedOnly: true });

    // ── Issue token ───────────────────────────────────
    generateTokenAndSetCookie(res, user._id);

    res
      .status(200)
      .json(
        new ApiResponse(200, user.toSafeObject(), "Logged in successfully"),
      );
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// POST /api/auth/logout
// ──────────────────────────────────────────────────────
export const logout = async (_req, res, next) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
    });

    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────────────
// GET /api/auth/me   (Protected)
// ──────────────────────────────────────────────────────
export const getMe = async (req, res, next) => {
  try {
    // req.user is set by auth middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    res
      .status(200)
      .json(new ApiResponse(200, user.toSafeObject(), "User profile fetched"));
  } catch (error) {
    next(error);
  }
};
