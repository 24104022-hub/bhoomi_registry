import mongoose from "mongoose";
import { Notification } from "../models/Notification.js";
import { retryNotificationEmail, testSendEmail, verifySmtpConnection } from "../services/emailService.js";

export async function getNotifications(req, res) {
  const { status, type } = req.query;
  const filter = {};

  if (req.user && req.user.role === "citizen") {
    filter.$or = [{ userId: req.user.id }, { recipientEmail: req.user.email }];
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  if (status && ["pending", "sent", "failed"].includes(status)) {
    filter.deliveryStatus = status;
  }

  if (type && type !== "all") {
    filter.type = type;
  }

  const notifications = await Notification.find(filter).sort({ createdAt: -1 });

  // Compute summary statistics
  const unreadCount = await Notification.countDocuments({ ...filter, read: false });
  const sentCount = await Notification.countDocuments({ ...filter, deliveryStatus: "sent" });
  const failedCount = await Notification.countDocuments({ ...filter, deliveryStatus: "failed" });

  res.json({
    success: true,
    total: notifications.length,
    unreadCount,
    sentCount,
    failedCount,
    data: notifications,
    notifications,
  });
}

export async function getNotificationById(req, res) {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
  const notif = await Notification.findOne(query);

  if (!notif) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }

  if (req.user.role === "citizen" && notif.userId !== req.user.id && notif.recipientEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: "Access denied to this notification." });
  }

  res.json({ success: true, data: notif });
}

export async function markNotificationAsRead(req, res) {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
  const notif = await Notification.findOneAndUpdate(query, { read: true }, { new: true });
  if (!notif) {
    return res.status(404).json({ success: false, message: "Notification not found." });
  }
  res.json({ success: true, data: notif });
}

export async function markAllNotificationsAsRead(req, res) {
  const userId = req.user ? req.user.id : req.body.userId;
  if (userId) {
    await Notification.updateMany({ userId, read: false }, { read: true });
  }
  res.json({ success: true, message: "All notifications marked as read." });
}

export async function retryNotification(req, res) {
  const { id } = req.params;
  const query = mongoose.Types.ObjectId.isValid(id) ? { $or: [{ id }, { _id: id }] } : { id };
  const notif = await Notification.findOne(query);

  if (!notif) {
    return res.status(404).json({ success: false, message: "Notification record not found." });
  }

  // Permission check: Citizen can only retry their own notifications; officials can retry any
  if (req.user.role === "citizen" && notif.userId !== req.user.id && notif.recipientEmail !== req.user.email) {
    return res.status(403).json({ success: false, message: "Access denied to retry this notification." });
  }

  try {
    const result = await retryNotificationEmail(id);
    return res.json({
      success: result.success,
      message: result.success ? "Email successfully redelivered over SMTP." : `Retry failed: ${result.error}`,
      data: result.notification,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to retry email delivery: ${err.message}`,
    });
  }
}

export async function sendTestEmail(req, res) {
  const toEmail = req.body.toEmail || req.user?.email || process.env.EMAIL_USER;

  if (!toEmail) {
    return res.status(400).json({
      success: false,
      message: "Please provide a target recipient email address (toEmail) to test live delivery.",
    });
  }

  const result = await testSendEmail(toEmail, req.body.recipientName || req.user?.fullName || "Citizen");

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
      notification: result.notification,
    });
  }

  res.json({
    success: true,
    message: result.isEthereal
      ? "Test sandbox email generated via Ethereal."
      : `Real email successfully dispatched to ${toEmail} via Gmail SMTP!`,
    data: {
      messageId: result.messageId,
      previewUrl: result.previewUrl,
      isEthereal: result.isEthereal,
      recipient: toEmail,
    },
  });
}

export async function checkSmtpStatus(req, res) {
  const status = await verifySmtpConnection();
  res.json({
    success: status.success,
    data: status,
  });
}
