import mongoose from "mongoose";

const propertyTransferSchema = new mongoose.Schema(
  {
    id: {
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
    propertyTitle: {
      type: String,
      required: true,
    },
    fromOwnerId: {
      type: String,
      index: true,
      default: "",
    },
    fromOwner: {
      type: String,
      required: true,
    },
    fromOwnerEmail: {
      type: String,
      default: "",
    },
    toOwnerId: {
      type: String,
      index: true,
      default: "",
    },
    toOwner: {
      type: String,
      required: true,
    },
    toEmail: {
      type: String,
      required: true,
      index: true,
    },
    transferType: {
      type: String,
      enum: ["Sale", "Gift", "Inheritance", "Partition"],
      default: "Sale",
    },
    status: {
      type: String,
      enum: ["pending", "underReview", "approved", "rejected"],
      default: "underReview",
      index: true,
    },
    deedNumber: {
      type: String,
      default: "",
    },
    estValue: {
      type: Number,
      default: 0,
    },
    transferFee: {
      type: Number,
      default: 0,
    },
    initiatedOn: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    completedOn: {
      type: String,
      default: null,
    },
    approvedBy: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
      default: null,
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

export const PropertyTransfer = mongoose.model("PropertyTransfer", propertyTransferSchema);
