import { Payment } from "../models/Payment.js";

export async function getPayments(req, res) {
  const payments = await Payment.find().sort({ createdAt: -1 });
  res.json({ success: true, count: payments.length, data: payments });
}

export async function createPayment(req, res) {
  const { relatedTo, description, amount, method, status } = req.body;
  const newId = `PAY-${Math.floor(5000 + Math.random() * 5000)}`;

  const payment = await Payment.create({
    id: newId,
    relatedTo: relatedTo || "REG-2026-0001",
    description: description || "Registration fee",
    amount: Number(amount) || 5000,
    method: method || "UPI",
    status: status || "due",
    date: new Date().toISOString().slice(0, 10),
  });

  res.status(201).json({ success: true, data: payment });
}

export async function updatePayment(req, res) {
  const { id } = req.params;
  const payment = await Payment.findOneAndUpdate({ id }, req.body, { new: true });

  if (!payment) {
    return res.status(404).json({ success: false, message: "Payment not found." });
  }

  res.json({ success: true, data: payment });
}
