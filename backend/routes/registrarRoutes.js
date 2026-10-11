import express from "express";
import {
  getRegistrarQueue,
  approveRegistration,
  rejectRegistration,
} from "../controllers/registrarController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/queue", protect, authorize("officer", "admin"), getRegistrarQueue);
router.post("/approve/:id", protect, authorize("officer", "admin"), approveRegistration);
router.post("/reject/:id", protect, authorize("officer", "admin"), rejectRegistration);

export default router;
