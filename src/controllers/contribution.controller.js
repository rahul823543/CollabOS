import Contribution from "../models/Contribution.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getByProject = asyncHandler(async (req, res) => {
  const contributions = await Contribution.find({ projectId: req.params.projectId })
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

  const contributions = await Contribution.find({ projectId }).populate("userId", "name");

  const totalTasks = await Task.countDocuments({ project: projectId });
  const doneTasks = await Task.countDocuments({ project: projectId, status: "done" });

  // fix 5 — count late tasks including null deadline tasks
  const lateTasks = await Task.countDocuments({
    project: projectId,
    status: { $ne: "done" },
    $or: [
      { deadline: { $lt: new Date() } },
      { deadline: null }
    ]
  });

  // fix 2 — get all team members including zero contribution users
  const project = await Project.findById(projectId);
  const team = await Team.findById(project.teamId).populate("members", "name");
  
  const userWeightMap = {};
  
  // initialize all team members with 0
  for (const member of team.members) {
    userWeightMap[member.name] = 0;
  }

  // add contribution weights
  for (const c of contributions) {
    const name = c.userId?.name || "Unknown";
    userWeightMap[name] = (userWeightMap[name] || 0) + (c.weight || 0);
  }

  const sorted = Object.entries(userWeightMap).sort((a, b) => b[1] - a[1]);
  
  // fix 3 — topContributor and leastActive cant be same if more than one member
  const topContributor = sorted[0]?.[0] || null;
  const leastActive = sorted.length > 1 ? sorted[sorted.length - 1]?.[0] : null;

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) + "%" : "0%";

  res.json({ topContributor, leastActive, completionRate, lateTasks });
});