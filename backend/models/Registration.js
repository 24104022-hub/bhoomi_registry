import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    stage: { type: String, required: true },
    status: { type: String, required: true },
    performedBy: { type: String, default: "System" },
    role: { type: String, default: "citizen" },
    remarks: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    propertyTitle: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Residential", "Agricultural", "Commercial", "Industrial"],
      default: "Residential",
    },
    areaSqft: {
      type: Number,
      required: true,
      min: 0,
    },
    address: {
      type: String,
      required: true,
    },
    coordinates: {
      lat: { type: Number, default: 9.9252 },
      lng: { type: Number, default: 78.1198 },
    },
    estValue: {
      type: Number,
      default: 0,
    },
    applicantId: {
      type: String,
      required: true,
      index: true,
    },
    applicantName: {
      type: String,
      required: true,
    },
    applicantEmail: {
      type: String,
      default: "",
    },
    registrationDate: {
      type: String, // Calendar date picked by user e.g. "2026-10-05"
      default: () => new Date().toISOString().slice(0, 10),
    },
    status: {
      type: String,
      enum: ["pending", "surveyorReview", "surveyVerified", "underReview", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    submittedOn: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    surveyorAssigned: {
      type: String,
      default: "P. Lakshmi, Licensed Surveyor",
    },
    officerAssigned: {
      type: String,
      default: "Deputy Registrar S. Anand",
    },
    surveyDetails: {
      boundaryVerified: { type: Boolean, default: false },
      remarks: { type: String, default: "" },
      surveyorName: { type: String, default: "" },
      verifiedAt: { type: Date, default: null },
    },
    officerRemarks: {
      type: String,
      default: "",
    },
    propertyId: {
      type: String,
      default: "",
    },
    deedNumber: {
      type: String,
      default: "",
    },
    surveyNumber: {
      type: String,
      default: "",
    },
    boundaries: {
      north: { type: String, default: "" },
      south: { type: String, default: "" },
      east: { type: String, default: "" },
      west: { type: String, default: "" },
    },
    timeline: [timelineEntrySchema],
  },
  {
    timestamps: true,
  }
);

export const Registration = mongoose.model("Registration", registrationSchema);
