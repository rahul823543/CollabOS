import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMySkills } from "../controllers/user.controller.js";

const router = express.Router();

router.use(protect);

router.get("/me/skills", getMySkills);

export default router;