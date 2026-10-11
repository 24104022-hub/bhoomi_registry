import express from "express";
import {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  approveTransfer,
  rejectTransfer,
} from "../controllers/transferController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/", protect, getTransfers);
router.get("/:id", protect, getTransferById);
router.post("/", protect, createTransfer);
router.put("/:id", protect, authorize("officer", "registrar", "admin"), updateTransfer);
router.post("/:id/approve", protect, authorize("officer", "registrar", "admin"), approveTransfer);
router.post("/:id/reject", protect, authorize("officer", "registrar", "admin"), rejectTransfer);

export default router;
