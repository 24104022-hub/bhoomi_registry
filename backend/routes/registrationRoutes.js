import express from "express";
import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  trackApplication,
} from "../controllers/registrationController.js";
import { protect, optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createRegistration);
router.get("/", protect, getRegistrations);
router.get("/track/:ref", optionalAuth, trackApplication);
router.get("/:id", protect, getRegistrationById);

export default router;
