import mongoose from "mongoose";

const landParcelSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    surveyNo: {
      type: String,
      required: true,
      index: true,
    },
    village: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    areaSqft: {
      type: Number,
      required: true,
    },
    classification: {
      type: String,
      required: true,
    },
    boundaryVerified: {
      type: Boolean,
      default: false,
    },
    surveyor: {
      type: String,
      default: "P. Lakshmi, Licensed Surveyor",
    },
    coordinates: {
      lat: { type: Number, default: 9.9252 },
      lng: { type: Number, default: 78.1198 },
    },
  },
  {
    timestamps: true,
  }
);

export const LandParcel = mongoose.model("LandParcel", landParcelSchema);
