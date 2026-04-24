import express from "express";
import { linkFolder, getFolderMetadata } from "../controllers/driveFolder.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/link-folder", protect, linkFolder);
router.get("/folder/:projectId", protect, getFolderMetadata);

export default router;