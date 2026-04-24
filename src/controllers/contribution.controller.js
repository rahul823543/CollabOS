import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getProjectContributions,
  getUserContributions,
} from "../services/contribution.service.js";

/**
 * GET /api/contributions/project/:projectId
 *
 * Returns all contribution data for a project:
 * - Users with their assigned tasks, status, weight %
 * - Top performers, last active user, total commits
 * - Late tasks (past deadline, not yet done)
 */
export const getContributionsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid projectId" });
  }

  const result = await getProjectContributions(projectId);
  res.status(200).json(result);
});

/**
 * GET /api/contributions/user/:userId
 *
 * Returns all contribution data for a specific user:
 * - Projects worked on, tasks per project
 * - Weights assigned, task status, commit counts
 */
export const getContributionsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const result = await getUserContributions(userId);
  res.status(200).json(result);
});
