import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import {
  getProjectContributions,
  getUserContributions,
  calculateWE,
} from "../services/contribution.service.js";

// Re-export calculateWE so other controllers can import from one place
export { calculateWE };

/**
 * GET /api/contributions/project/:projectId
 *
 * Returns all contribution data for a project:
 * - Project id, title, description (goal), status (active / done)
 * - Top performers (by WE), mostActiveCodeWorkUser, leastActiveCodeWorkUser
 * - percentTaskCompleted (weight-based), lateTasks
 * - Full task details (Page 3 format) for every task in the project
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
 * Returns contribution data for a specific user:
 * - userId, userName  (no email)
 * - Full task details (Page 3 format) for every task assigned to this user
 * - overallStats: totalTasks, completedTasks, totalWeightAssigned, totalWeightEarned
 */
export const getContributionsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const result = await getUserContributions(userId);
  res.status(200).json(result);
});
