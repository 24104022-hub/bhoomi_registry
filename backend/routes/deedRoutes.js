import express from "express";
import {
  getDeedByNumber,
  verifyDeedPublic,
  downloadDeedPdf,
  listDeeds,
  updateDeedStatus,
} from "../controllers/deedController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Publicly accessible for QR code scanning
router.get("/verify/:deedNumber", verifyDeedPublic);
router.get("/:deedNumber/pdf", downloadDeedPdf);
router.patch("/:deedNumber/status", protect, authorize("officer", "admin"), updateDeedStatus);
router.get("/:deedNumber", optionalAuth, getDeedByNumber);
router.get("/", protect, listDeeds);

export default router;

