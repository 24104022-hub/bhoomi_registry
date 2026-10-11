import express from "express";
import { getUsers, getUserById, updateUserRole, deleteUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorize("admin"));

router.get("/", getUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
