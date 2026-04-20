import express from "express";
import { connectGithub } from "../controllers/github.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { syncCommits } from "../controllers/github.controller.js";
import { getProjectContributions } from "../controllers/github.controller.js";

const router = express.Router();

router.post("/connect", protect, connectGithub);
router.get("/commits/:projectId", protect, syncCommits);
router.get("/contributions/:projectId", protect, getProjectContributions);

export default router;