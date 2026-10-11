import mongoose from "mongoose";

const actionLogSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ["registration", "property", "transfer", "deed", "document"],
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true, // e.g., "SURVEY_VERIFIED", "SURVEY_FLAGGED", "REGISTRAR_APPROVED", "REGISTRAR_REJECTED", "DEED_ISSUED"
    },
    performedBy: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    previousStatus: {
      type: String,
      default: "",
    },
    newStatus: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      default: "",
    },
    emailSentTo: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ActionLog = mongoose.model("ActionLog", actionLogSchema);
