import Integration from "../models/Integration.js";
import asyncHandler from "../utils/asyncHandler.js";
import Contribution from "../models/Contribution.js";
import { fetchCommits } from "../services/github.service.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const connectGithub = asyncHandler(async (req, res) => {
  const { projectId, repoLink, githubUsername } = req.body;

  if (!projectId || !repoLink) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const parts = repoLink.split("/");
  const repoOwner = parts[3];
  const repoName = parts[4];

  if (!repoOwner || !repoName) {
    return res.status(400).json({ message: "Invalid repo link" });
  }

  const integration = await Integration.findOneAndUpdate(
    { projectId },
    {
      projectId,
      githubUsername,
      repoOwner,
      repoName,
    },
    { upsert: true, new: true }
  );

  res.status(200).json({
    success: true,
    data: integration,
  });
});

export const syncCommits = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid projectId" });
  }

  const integration = await Integration.findOne({ projectId });

  if (!integration) {
    return res.status(404).json({ message: "GitHub not connected" });
  }

  const commits = await fetchCommits(
    integration.repoOwner,
    integration.repoName
  );

  for (const c of commits) {
    const user = await User.findOne({
      name: new RegExp(`^${c.author}$`, "i"),
    });

    await Contribution.findOneAndUpdate(
      { commitId: c.commitId },
      {
        projectId,
        userId: user?._id || null,
        commitMessage: c.message,
        authorName: c.author,
        timestamp: c.timestamp,
      },
      { upsert: true, returnDocument: "after" }
    );
  }

  res.status(200).json({
    success: true,
    message: "Commits synced",
    saved: commits.length,
  });
});

export const getProjectContributions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Invalid projectId" });
  }

  const contributions = await Contribution.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $group: {
        _id: "$userId",
        commits: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 0,
        user: {
          $ifNull: ["$user.name", "Unmapped"],
        },
        commits: 1,
      },
    },
    {
      $sort: { commits: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    data: contributions,
  });
});