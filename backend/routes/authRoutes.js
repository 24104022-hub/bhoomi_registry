import express from "express";
import {
  login,
  register,
  googleLogin,
  getGoogleAuthUrl,
  handleGoogleCallback,
  exchangeGoogleCode,
  completeGoogleRegistration,
  getMe,
  updateProfile,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Email / Password Login & Registration (with bcrypt)
router.post("/login", login);
router.post("/register", register);

// Google OAuth 2.0 End-to-End Flow
router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", handleGoogleCallback);
router.get("/callback", handleGoogleCallback); // Alias in case OAuth provider or proxy redirects to /api/auth/callback
router.post("/google/exchange", exchangeGoogleCode);
router.post("/google/register", completeGoogleRegistration);
router.post("/google", googleLogin);

// Session & Profile
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);

export default router;
