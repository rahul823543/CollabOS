import Contribution from "../models/Contribution.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

export const getByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId))
    return res.status(400).json({ message: "Invalid projectId" });

  const contributions = await Contribution.find({ projectId })
    .populate("userId", "name email")
    .populate("taskId", "title weight");

  res.json(contributions);
});

export const getByUser = asyncHandler(async (req, res) => {
  // only allow user to see their own contributions
  if (req.params.userId !== req.user._id.toString())
    return res.status(403).json({ message: "Not authorized to view this user's contributions" });

  const contributions = await Contribution.find({ userId: req.params.userId })
    .populate("taskId", "title weight")
    .populate("projectId", "title");

  res.json(contributions);
});

export const getInsights = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId))
    return res.status(400).json({ message: "Invalid projectId" });

  const contributions = await Contribution.find({ projectId }).populate("userId", "name");

  const totalTasks = await Task.countDocuments({ project: projectId });
  const doneTasks = await Task.countDocuments({ project: projectId, status: "done" });

  // P0 FIX: only count tasks with an actual deadline that has passed as "late"
  const lateTasks = await Task.countDocuments({
    project: projectId,
    status: { $ne: "done" },
    deadline: { $ne: null, $lt: new Date() },
  });

  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });

  const team = await Team.findById(project.teamId).populate("members", "name");
  if (!team) return res.status(404).json({ message: "Team not found" });

  const userWeightMap = {};

  // initialize all team members with 0
  for (const member of team.members) {
    userWeightMap[member.name] = 0;
  }

  // P0 FIX: use the contribution's own weight field (now exists in schema)
  for (const c of contributions) {
    const name = c.userId?.name || "Unknown";
    userWeightMap[name] = (userWeightMap[name] || 0) + (c.weight || 1);
  }

  const sorted = Object.entries(userWeightMap).sort((a, b) => b[1] - a[1]);

  const topContributor = sorted[0]?.[0] || null;
  const leastActive = sorted.length > 1 ? sorted[sorted.length - 1]?.[0] : null;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) + "%" : "0%";

  res.json({ topContributor, leastActive, completionRate, lateTasks });
});