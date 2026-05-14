import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

// PUT /users/skills
// Body: { skills: ["React", "Node"] }
// Updates skills for the currently logged-in user
export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  if (!skills || !Array.isArray(skills)) {
    res.status(400);
    throw new Error("skills must be an array");
  }

  const cleaned = skills
    .map((s) => s.trim())
    .filter(Boolean);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { skills: cleaned },
    { new: true, runValidators: true }
  ).select("name email skills");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user);
});

// GET /users/me/skills
// Returns the logged-in user's current skills
export const getMySkills = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("name email skills");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json({ userId: user._id, name: user.name, skills: user.skills });
});