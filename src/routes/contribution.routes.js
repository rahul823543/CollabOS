import express from "express";
import {
  getContributionsByProject,
  getContributionsByUser,
} from "../controllers/contribution.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/contributions/project/:projectId
router.get("/project/:projectId", protect, getContributionsByProject);

// GET /api/contributions/user/:userId
router.get("/user/:userId", protect, getContributionsByUser);

export default router;
