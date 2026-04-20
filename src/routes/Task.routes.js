import express from "express";
import {
  createTask,
  getTasks,
  updateTaskStatus,
  deleteTask
} from "../controllers/Task.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createTask);
router.get("/", protect, getTasks);
router.put("/:id", protect, updateTaskStatus);
router.delete("/:id", protect, deleteTask);

export default router;