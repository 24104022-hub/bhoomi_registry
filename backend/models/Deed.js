import mongoose from "mongoose";

const deedSchema = new mongoose.Schema(
  {
    deedNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    propertyId: {
      type: String,
      required: true,
      index: true,
    },
    registrationId: {
      type: String,
      default: "",
    },
    ownerId: {
      type: String,
      required: true,
    },
    ownerName: {
      type: String,
      required: true,
    },
    propertyTitle: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      default: "Residential",
    },
    areaSqft: {
      type: Number,
      required: true,
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
    boundaries: {
      north: { type: String, default: "" },
      south: { type: String, default: "" },
      east: { type: String, default: "" },
      west: { type: String, default: "" },
    },
    registrationDate: {
      type: String,
      default: "",
    },
    approvalRemarks: {
      type: String,
      default: "",
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    surveyNumber: {
      type: String,
      default: "",
    },
    surveyorName: {
      type: String,
      default: "P. Lakshmi, Licensed Surveyor",
    },
    registrarName: {
      type: String,
      default: "Deputy Registrar S. Anand",
    },
    registrarOffice: {
      type: String,
      default: "Sub-Registrar Office, Madurai Central",
    },
    digitalSignatureHash: {
      type: String,
      required: true,
    },
    verificationUrl: {
      type: String,
      required: true,
    },
    qrCodeDataUrl: {
      type: String,
      default: "",
    },
    pdfPath: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "transferred", "revoked"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Deed = mongoose.model("Deed", deedSchema);
