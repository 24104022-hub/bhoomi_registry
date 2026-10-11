import express from "express";
import {
  getProperties,
  getPropertyById,
  getRecentlyViewed,
  createProperty,
  updateProperty,
} from "../controllers/propertyController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getProperties);
router.get("/recently-viewed", protect, getRecentlyViewed);
router.get("/:id", protect, getPropertyById);
router.post("/", protect, createProperty);
router.put("/:id", protect, updateProperty);

export default router;
