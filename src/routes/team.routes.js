import express from "express";
import {
  createTeam,
  addMember,
  removeMember,
  getTeamDetails,
} from "../controllers/team.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/create", createTeam);
router.post("/add-member", addMember);
router.post("/remove-member", removeMember);
router.get("/:id", getTeamDetails);

export default router;
