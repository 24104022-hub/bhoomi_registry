import express from "express";
import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  retryNotification,
  sendTestEmail,
  checkSmtpStatus,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.get("/smtp-status", protect, checkSmtpStatus);
router.post("/test-email", protect, sendTestEmail);
router.get("/:id", protect, getNotificationById);
router.post("/:id/retry", protect, retryNotification);
router.put("/read-all", protect, markAllNotificationsAsRead);
router.put("/:id/read", protect, markNotificationAsRead);

export default router;
