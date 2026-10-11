import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    recipientEmail: {
      type: String,
      default: "",
      index: true,
    },
    recipientName: {
      type: String,
      default: "Citizen",
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["registration", "survey", "approval", "transfer", "deed", "payment", "appointment", "system"],
      default: "system",
    },
    actionType: {
      type: String,
      default: "SYSTEM_NOTIFICATION",
    },
    referenceId: {
      type: String,
      default: "",
      index: true,
    },
    propertyTitle: {
      type: String,
      default: "",
    },
    deliveryStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    smtpMessageId: {
      type: String,
      default: "",
    },
    previewUrl: {
      type: String,
      default: "",
    },
    errorDetails: {
      type: String,
      default: "",
    },
    attempts: {
      type: Number,
      default: 1,
    },
    lastAttemptAt: {
      type: Date,
      default: Date.now,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model("Notification", notificationSchema);
