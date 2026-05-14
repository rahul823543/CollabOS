import asyncHandler from "../utils/asyncHandler.js";
import Team from "../models/Team.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import { isUserOnline } from "../socket/onlineTracker.js";

export const createTeam = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400);
    throw new Error("Team name is required");
  }

  const existingTeam = await Team.findOne({
    members: req.user._id,
  });

  if (existingTeam) {
    res.status(400);
    throw new Error("You are already in a team");
  }

  const team = await Team.create({
    name: name.trim(),
    members: [req.user._id],
    createdBy: req.user._id,
  });

  const populated = await Team.findById(team._id)
    .populate("members", "name email skills")
    .populate("createdBy", "name email");

  res.status(201).json(populated);
});

export const sendInvite = asyncHandler(async (req, res) => {
  const { teamId, email } = req.body;

  if (!teamId || !email) {
    res.status(400);
    throw new Error("teamId and email required");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  if (team.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only leader can invite members");
  }

  const targetUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!targetUser) {
    res.status(404);
    throw new Error("User not found");
  }

  const alreadyMember = team.members.some(
    (m) => m.toString() === targetUser._id.toString()
  );

  if (alreadyMember) {
    res.status(400);
    throw new Error("User already in team");
  }

  const alreadyInvited = (targetUser.pendingInvites || []).some(
    (invite) => invite.teamId.toString() === teamId
  );

  if (alreadyInvited) {
    res.status(400);
    throw new Error("Invite already pending");
  }

  targetUser.pendingInvites.push({
    teamId: team._id,
    teamName: team.name,
    invitedBy: req.user._id,
  });

  await targetUser.save();

  res.json({
    message: "Invite sent successfully",
  });
});

export const getMyInvites = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("pendingInvites.invitedBy", "name");

  res.json(user.pendingInvites || []);
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const { teamId } = req.body;

  const user = await User.findById(req.user._id);
  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  const inviteExists = (user.pendingInvites || []).some(
    (invite) => invite.teamId.toString() === teamId
  );

  if (!inviteExists) {
    res.status(400);
    throw new Error("Invite not found");
  }

  const alreadyMember = team.members.some(
    (m) => m.toString() === user._id.toString()
  );

  if (!alreadyMember) {
    team.members.push(user._id);
    await team.save();
  }

  user.pendingInvites = user.pendingInvites.filter(
    (invite) => invite.teamId.toString() !== teamId
  );

  await user.save();

  res.json({
    message: "Joined team successfully",
  });
});

export const rejectInvite = asyncHandler(async (req, res) => {
  const { teamId } = req.body;

  const user = await User.findById(req.user._id);

  user.pendingInvites = user.pendingInvites.filter(
    (invite) => invite.teamId.toString() !== teamId
  );

  await user.save();

  res.json({
    message: "Invite rejected",
  });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.body;

  if (!teamId || !userId) {
    res.status(400);
    throw new Error("teamId and userId required");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  if (team.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Only leader can remove members");
  }

  if (userId === team.createdBy.toString()) {
    res.status(400);
    throw new Error("Leader cannot remove self");
  }

  team.members = team.members.filter(
    (m) => m.toString() !== userId
  );

  await team.save();

  const populated = await Team.findById(team._id)
    .populate("members", "name email skills")
    .populate("createdBy", "name email");

  res.json(populated);
});

export const leaveTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.body;

  if (!teamId) {
    res.status(400);
    throw new Error("teamId required");
  }

  const team = await Team.findById(teamId);

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  const userId = req.user._id.toString();

  const isMember = team.members.some(
    (m) => m.toString() === userId
  );

  if (!isMember) {
    res.status(400);
    throw new Error("Not a member");
  }

  const isCreator = team.createdBy.toString() === userId;

  if (isCreator) {
    if (team.members.length === 1) {
      await Team.deleteOne({ _id: team._id });

      return res.json({
        message: "Team deleted",
      });
    }

    res.status(400);
    throw new Error("Leader must remove members first");
  }

  team.members = team.members.filter(
    (m) => m.toString() !== userId
  );

  await team.save();

  res.json({
    message: "Left team successfully",
  });
});

export const getTeamDetails = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate("members", "name email skills")
    .populate("createdBy", "name email");

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  const isMember = team.members.some(
    (m) => m._id.toString() === req.user._id.toString()
  );

  if (!isMember) {
    res.status(403);
    throw new Error("Not authorized");
  }

  res.json(team);
});

export const getMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({
    members: req.user._id,
  })
    .populate("members", "name email skills")
    .populate("createdBy", "name email");

  res.json(teams);
});

export const getTeamActivity = asyncHandler(async (req, res) => {
  const { teamId } = req.params;

  const team = await Team.findById(teamId)
    .populate("members", "name email");

  if (!team) {
    res.status(404);
    throw new Error("Team not found");
  }

  const projects = await Project.find({ teamId });
  const projectIds = projects.map((p) => p._id);

  const tasks = await Task.find({
    project: { $in: projectIds },
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(
    (t) => t.status === "done"
  ).length;

  const members = team.members.map((member) => ({
    _id: member._id,
    name: member.name,
    email: member.email,
    isOnline: isUserOnline(member._id),
  }));

  res.json({
    members,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    overallProgress:
      totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0,
  });
});