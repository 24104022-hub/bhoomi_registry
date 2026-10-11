import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    purpose: {
      type: String,
      required: true,
    },
    relatedTo: {
      type: String,
      required: true,
      index: true,
    },
    citizenName: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      default: "",
    },
    assignedTo: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["surveyor", "officer", "lawyer"],
      default: "officer",
    },
    dateTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
