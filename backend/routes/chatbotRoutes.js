import express from "express";
import { handleChatbotMessage } from "../controllers/chatbotController.js";

const router = express.Router();

router.post("/message", handleChatbotMessage);

export default router;
