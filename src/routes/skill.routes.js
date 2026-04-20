import express from "express";
import {
  updateSkills,
  getTeamMembers,
} from "../controllers/skill.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.put("/users/skills", updateSkills);
router.get("/teams/:teamId/members", getTeamMembers);

export default router;
