import express from "express";
import {
  getLandParcels,
  createLandParcel,
  updateLandParcel,
} from "../controllers/landParcelController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getLandParcels);
router.post("/", protect, createLandParcel);
router.put("/:id", protect, updateLandParcel);

export default router;
