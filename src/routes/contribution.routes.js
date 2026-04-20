import express from "express";
import { getByProject, getByUser, getInsights } from "../controllers/contribution.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/project/:projectId", getByProject);
router.get("/user/:userId", getByUser);
router.get("/insights/:projectId", getInsights);

export default router;