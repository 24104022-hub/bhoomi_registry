import express from "express";
import { getDocuments, createDocument, updateDocument } from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getDocuments);
router.post("/", protect, createDocument);
router.put("/:id", protect, updateDocument);

export default router;
