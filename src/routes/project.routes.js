import express from "express";
import {
    createProject,
    getProjectsByTeam,
    updateProject,
    deleteProject,
    createProjectWithAI
} from "../controllers/project.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/create", protect, createProject);
router.post("/create-with-ai", protect, createProjectWithAI);
router.get("/team/:teamId", protect, getProjectsByTeam);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);

export default router;

