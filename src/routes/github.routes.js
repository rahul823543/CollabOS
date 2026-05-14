import express from "express";
import {
  connectGithub,
  syncCommits,
  getProjectContributions,
} from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectGithub);
router.post("/sync/:projectId", protect, syncCommits);
router.get("/contributions/:projectId", protect, getProjectContributions);

export default router;