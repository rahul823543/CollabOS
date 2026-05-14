import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Team from "../models/Team.js";

const MAX_SKILLS = 15;
const SKILL_REGEX = /^[a-zA-Z0-9+#./&()\-\s]{2,50}$/;

// PUT /users/skills
export const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;

  if (!Array.isArray(skills)) {
    res.status(400);
    throw new Error("skills must be an array");
  }

  const normalizedSkills = [
    ...new Set(
      skills
        .map((skill) => String(skill).trim())
        .filter(Boolean)
    ),
  ];

  if (normalizedSkills.length > MAX_SKILLS) {
    res.status(400);
    throw new Error(`Maximum ${MAX_SKILLS} skills allowed`);
  }

  const invalidSkills = normalizedSkills.filter(
    (skill) => !SKILL_REGEX.test(skill)
  );

  if (invalidSkills.length > 0) {
    res.status(400);
    throw new Error(
      `Invalid skills: ${invalidSkills.join(", ")}`
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { skills: normalizedSkills },
    { new: true, runValidators: true }
  );

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

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

  const isMember = team.members.some(
    (m) => m._id.toString() === req.user._id.toString()
  );

  if (!isMember) {
    res.status(403);
    throw new Error("Not authorized — you are not a member of this team");
  }

  const members = team.members.map((member) => ({
    userId: member._id,
    name: member.name,
    skills: member.skills || [],
  }));

  res.json(members);
});