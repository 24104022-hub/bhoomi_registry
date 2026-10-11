import mongoose from "mongoose";

const timelineEntrySchema = new mongoose.Schema(
  {
    stage: { type: String, required: true }, // e.g., "Registration Submitted", "Surveyor Verification", "Registrar Review", "Deed Issued"
    status: { type: String, required: true }, // e.g., "pending", "verified", "approved", "rejected"
    performedBy: { type: String, default: "System" },
    role: { type: String, default: "citizen" },
    remarks: { type: String, default: "" },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const propertySchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    parcelId: {
      type: String,
      default: "",
      index: true,
    },
    title: {
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
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      default: "",
    },
    registered: {
      type: Boolean,
      default: false,
    },
    registeredOn: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "surveyorReview", "surveyVerified", "registrarReview", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    deedNumber: {
      type: String,
      default: "",
      index: true,
    },
    registrationId: {
      type: String,
      default: "",
      index: true,
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
    surveyDetails: {
      surveyorName: { type: String, default: "" },
      surveyDate: { type: String, default: "" },
      boundaryVerified: { type: Boolean, default: false },
      remarks: { type: String, default: "" },
      surveyNo: { type: String, default: "" },
    },
    registrarRemarks: {
      type: String,
      default: "",
    },
    timeline: [timelineEntrySchema],
    recentlyViewedBy: [
      {
        userId: { type: String, index: true },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Property = mongoose.model("Property", propertySchema);
