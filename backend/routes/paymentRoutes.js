import express from "express";
import { getPayments, createPayment, updatePayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getPayments);
router.post("/", protect, createPayment);
router.put("/:id", protect, updatePayment);

export default router;
