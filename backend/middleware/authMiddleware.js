import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function protect(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. No token provided.",
    });
  }

  try {
    const secret = process.env.JWT_SECRET || "bhoomi_super_secret_jwt_key_2026_land_registry_secure";
    const decoded = jwt.verify(token, secret);

    const user = await User.findOne({
      $or: [{ id: decoded.id }, { email: decoded.email }].filter(Boolean),
    }).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Your session has expired. Please log in again.",
      });
    }
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid or expired authentication token. Please log in again.",
    });
  }
}

// Optional auth for public routes that want to optionally read user context
export async function optionalAuth(req, res, next) {
  let token = null;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return next();

  try {
    const secret = process.env.JWT_SECRET || "bhoomi_super_secret_jwt_key_2026_land_registry_secure";
    const decoded = jwt.verify(token, secret);
    const user = await User.findOne({ id: decoded.id }).select("-password");
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    /* ignore optional auth failure */
  }

  next();
}
