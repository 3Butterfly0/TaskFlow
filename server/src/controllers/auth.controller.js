import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT and set HttpOnly cookie
const generateTokenAndSetCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, "Please provide username, email, and password");
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters");
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new ApiError(
        400,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "A user with this email already exists");
    }

    const user = await User.create({ username, email, password });
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

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "Please provide email and password");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.mfaEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, mfaPending: true },
        process.env.JWT_SECRET,
        {
          expiresIn: "5m",
        },
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { requiresMfa: true, tempToken },
            "MFA required",
          ),
        );
    }

    user.lastSeen = new Date();
    await user.save({ validateModifiedOnly: true });

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

// POST /api/auth/logout
export const logout = async (_req, res, next) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
    });

    res.status(200).json(new ApiResponse(200, null, "Logged out successfully"));
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("pinnedProjects", "name")
      .populate("lastAccessedProjects.projectId", "name");
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

// PATCH /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { username } = req.body;

    if (!username || username.trim() === "") {
      throw new ApiError(400, "Username is required");
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    user.username = username.trim();
    await user.save({ validateModifiedOnly: true });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user.toSafeObject(),
          "Profile updated successfully",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current and new passwords are required");
    }

    if (newPassword.length < 8) {
      throw new ApiError(400, "New password must be at least 8 characters");
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new ApiError(
        400,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, "Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    res
      .status(200)
      .json(new ApiResponse(200, null, "Password changed successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/mfa/setup
export const setupMfa = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new ApiError(404, "User not found");
    if (user.mfaEnabled) throw new ApiError(400, "MFA is already enabled");

    const secret = speakeasy.generateSecret({
      name: `TaskFlow (${user.email})`,
    });
    const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

    user.mfaSecret = secret.base32;
    await user.save({ validateModifiedOnly: true });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { secret: secret.base32, qrCode: qrCodeDataUrl },
          "MFA setup initialized",
        ),
      );
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/mfa/verify
export const verifyMfa = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new ApiError(400, "Token is required");

    const user = await User.findById(req.user.id).select("+mfaSecret");
    if (!user) throw new ApiError(404, "User not found");
    if (!user.mfaSecret) throw new ApiError(400, "MFA setup not initialized");

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!isValid) throw new ApiError(400, "Invalid code. Please try again.");

    user.mfaEnabled = true;
    await user.save({ validateModifiedOnly: true });

    res
      .status(200)
      .json(
        new ApiResponse(200, null, "MFA verified and enabled successfully"),
      );
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/mfa/disable
export const disableMfa = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw new ApiError(400, "Token is required");

    const user = await User.findById(req.user.id).select("+mfaSecret");
    if (!user) throw new ApiError(404, "User not found");
    if (!user.mfaEnabled) throw new ApiError(400, "MFA is not enabled");

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!isValid) throw new ApiError(400, "Invalid code. Please try again.");

    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    res
      .status(200)
      .json(new ApiResponse(200, null, "MFA disabled successfully"));
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/mfa/validate
export const validateMfa = async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;

    if (!tempToken || !token) {
      throw new ApiError(400, "Temporary token and 2FA code are required");
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      throw new ApiError(
        401,
        "Expired or invalid temporary token. Please login again.",
      );
    }

    if (!decoded.mfaPending) {
      throw new ApiError(400, "Invalid token type");
    }

    const user = await User.findById(decoded.id).select("+mfaSecret");
    if (!user || !user.mfaEnabled) {
      throw new ApiError(400, "Invalid MFA state");
    }

    const isValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 1,
    });

    if (!isValid) throw new ApiError(400, "Invalid code. Please try again.");

    user.lastSeen = new Date();
    await user.save({ validateModifiedOnly: true });

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

// POST /api/auth/google
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      throw new ApiError(400, "Google credential is required");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new ApiError(400, "Invalid Google payload");
    }

    const { email, name, sub: googleId, picture: avatar } = payload;
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = user.avatar || avatar;
        await user.save({ validateModifiedOnly: true });
      }
    } else {
      const randomPassword = Math.random().toString(36).slice(-8) + "Aa1!";
      user = await User.create({
        username:
          name.replace(/\s+/g, "").toLowerCase() +
          Math.random().toString(36).substring(2, 6),
        email,
        password: randomPassword,
        googleId,
        avatar,
        role: "member",
      });
    }

    if (user.mfaEnabled) {
      const tempToken = jwt.sign(
        { id: user._id, mfaPending: true },
        process.env.JWT_SECRET,
        { expiresIn: "5m" },
      );
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { requiresMfa: true, tempToken },
            "MFA required",
          ),
        );
    }

    user.lastSeen = new Date();
    await user.save({ validateModifiedOnly: true });

    generateTokenAndSetCookie(res, user._id);

    res
      .status(200)
      .json(
        new ApiResponse(200, user.toSafeObject(), "Google login successful"),
      );
  } catch (error) {
    next(error);
  }
};
