import asyncHandler from "../utils/asyncHandler.js";
import Team from "../models/Team.js";
import User from "../models/User.js";

// POST /team/create
export const createTeam = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Team name is required");
  }

  const team = await Team.create({
    name,
    members: [req.user._id],
    createdBy: req.user._id,
  });

  res.status(201).json(team);
});

// POST /team/add-member
export const addMember = asyncHandler(async (req, res) => {
  const { teamId, email, userId } = req.body;

  if (!teamId) {
    res.status(400);
    throw new Error("teamId is required");
  }

  if (!email && !userId) {
    res.status(400);
    throw new Error("Provide either email or userId to add a member");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  // Only creator can add members
  if (team.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the team creator can add members");
  }

  // Find the user to add — by email or by ID
  let userToAdd;

  if (email) {
    userToAdd = await User.findOne({ email: email.toLowerCase() });
  } else {
    userToAdd = await User.findById(userId);
  }

  if (!userToAdd) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if already a member
  if (team.members.some((m) => m.toString() === userToAdd._id.toString())) {
    res.status(400);
    throw new Error("User is already a member of this team");
  }

  team.members.push(userToAdd._id);
  await team.save();

  const populated = await Team.findById(team._id).populate(
    "members",
    "name email skills"
  );

  res.json(populated);
});

// POST /team/remove-member
export const removeMember = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.body;

  if (!teamId || !userId) {
    res.status(400);
    throw new Error("teamId and userId are required");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  // Only creator can remove members
  if (team.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only the team creator can remove members");
  }

  // Can't remove the creator
  if (userId === team.createdBy.toString()) {
    res.status(400);
    throw new Error("Cannot remove the team creator");
  }

  // Check if user is actually in the team
  if (!team.members.some((m) => m.toString() === userId)) {
    res.status(400);
    throw new Error("User is not a member of this team");
  }

  team.members = team.members.filter((m) => m.toString() !== userId);
  await team.save();

  const populated = await Team.findById(team._id).populate(
    "members",
    "name email skills"
  );

  res.json(populated);
});

// GET /team/:id
export const getTeamDetails = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate("members", "name email skills")
    .populate("createdBy", "name email");

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  res.json(team);
});

// GET /team/my-teams
export const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    $or: [
      { createdBy: req.user._id },
      { members: req.user._id }
    ]
  }).populate("members", "name email")
    .populate("createdBy", "name email");
  
  // Return unique teams (just in case)
  const uniqueTeamsMap = new Map();
  teams.forEach(team => uniqueTeamsMap.set(team._id.toString(), team));
  res.json(Array.from(uniqueTeamsMap.values()));
});
