import express from "express";
import {
  registerUser,
  loginUser,
  googleLogin,
} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});
router.post("/google", googleLogin);

export default router;