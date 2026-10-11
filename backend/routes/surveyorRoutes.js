import express from "express";
import { getSurveyorQueue, verifyBoundary } from "../controllers/surveyorController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/queue", protect, authorize("surveyor", "admin", "officer"), getSurveyorQueue);
router.post("/verify/:id", protect, authorize("surveyor", "officer", "admin"), verifyBoundary);

export default router;
