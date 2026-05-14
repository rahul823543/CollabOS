import express from "express";
import {
  createTeam,
  sendInvite,
  getMyInvites,
  acceptInvite,
  rejectInvite,
  removeMember,
  leaveTeam,
  getTeamDetails,
  getMyTeams,
  getTeamActivity,
} from "../controllers/team.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/create", createTeam);

router.post("/invite", sendInvite);
router.get("/my-invites", getMyInvites);
router.post("/accept-invite", acceptInvite);
router.post("/reject-invite", rejectInvite);

router.post("/remove-member", removeMember);
router.post("/leave", leaveTeam);

router.get("/my-teams", getMyTeams);
router.get("/activity/:teamId", getTeamActivity);
router.get("/:id", getTeamDetails);

export default router;