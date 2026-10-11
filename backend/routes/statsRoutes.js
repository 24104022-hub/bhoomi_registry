import express from "express";
import { getDashboardStats } from "../controllers/statsController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", optionalAuth, getDashboardStats);

export default router;
