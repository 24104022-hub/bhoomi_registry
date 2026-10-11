import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    relatedTo: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["Deed", "ID Proof", "Survey Certificate", "Legal", "Other"],
      default: "Deed",
    },
    fileUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    uploadedOn: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    uploadedBy: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      default: "",
    },
    verifiedBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const Document = mongoose.model("Document", documentSchema);
