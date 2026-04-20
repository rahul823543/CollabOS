import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Team from "../models/Team.js";

// PUT /users/skills
export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  if (!skills || !Array.isArray(skills) || skills.length === 0) {
    res.status(400);
    throw new Error("skills must be a non-empty array");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { skills },
    { new: true, runValidators: true }
  );

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    skills: user.skills,
  });
});

// GET /teams/:teamId/members
export const getTeamMembers = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).populate(
    "members",
    "name skills"
  );

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  const members = team.members.map((member) => ({
    userId: member._id,
    name: member.name,
    skills: member.skills,
  }));

  res.json(members);
});
