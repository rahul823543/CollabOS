import express from "express";
import {
  connectGoogle,
  googleCallback,
  getGoogleFiles,
} from "../controllers/google.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/connect", protect, connectGoogle);
router.get("/callback", googleCallback);
router.get("/files", protect, getGoogleFiles);

export default router;