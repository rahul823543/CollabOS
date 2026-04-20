import express from "express";
import { generateTasksController } from "../controllers/ai.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/generate-tasks", protect, generateTasksController);

export default router;