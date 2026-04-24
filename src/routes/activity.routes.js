import express from "express";
import { getTeamActivity } from "../controllers/activity.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/activity/:teamId", getTeamActivity);

export default router;
