import rateLimit from "express-rate-limit";

export const authLimiter = process.env.NODE_ENV === "test" ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: {
    success: false,
    message: "Too many login/register attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = process.env.NODE_ENV === "test" ? (req, res, next) => next() : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    message: "Too many password reset requests. Please try again after an hour.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const mfaLimiter = process.env.NODE_ENV === "test" ? (req, res, next) => next() : rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many MFA attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
