import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    relatedTo: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      default: "UPI",
    },
    status: {
      type: String,
      enum: ["paid", "due", "failed"],
      default: "due",
    },
    date: {
      type: String,
      default: () => new Date().toISOString().slice(0, 10),
    },
    transactionId: {
      type: String,
      default: () => `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model("Payment", paymentSchema);
