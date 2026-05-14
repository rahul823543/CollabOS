import Integration from "../models/Integration.js";
import asyncHandler from "../utils/asyncHandler.js";
import Contribution from "../models/Contribution.js";
import { fetchCommits } from "../services/github.service.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const GITHUB_REPO_REGEX =
  /^https?:\/\/github\.com\/([^/]+)\/([^/\s?#]+)\/?$/i;

export const connectGithub = asyncHandler(async (req, res) => {
  const { projectId, repoLink, githubUsername } = req.body;

  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      message: "Valid projectId required",
    });
  }

  if (!repoLink) {
    return res.status(400).json({
      message: "repoLink is required",
    });
  }

  const match = repoLink.trim().match(GITHUB_REPO_REGEX);

  if (!match) {
    return res.status(400).json({
      message:
        "Invalid GitHub repo URL. Expected: https://github.com/owner/repo",
    });
  }

  const repoOwner = match[1];
  const repoName = match[2].replace(/\.git$/, "");

  const integration = await Integration.findOneAndUpdate(
    { projectId },
    {
      projectId,
      githubUsername: githubUsername?.trim() || undefined,
      repoOwner,
      repoName,
    },
    {
      upsert: true,
      new: true,
    }
  );

  res.status(200).json({
    success: true,
    data: integration,
  });
});

const resolveUser = async (commit) => {
  // Match by GitHub username first
  if (commit.githubUsername) {
    const user = await User.findOne({
      githubUsername: {
        $regex: new RegExp(
          `^${commit.githubUsername}$`,
          "i"
        ),
      },
    });

    if (user) return user._id;
  }

  // Fallback email match
  if (commit.authorEmail) {
    const user = await User.findOne({
      email: commit.authorEmail.toLowerCase(),
    });

    if (user) return user._id;
  }

  return null;
};

export const syncCommits = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      message: "Invalid projectId",
    });
  }

  const integration = await Integration.findOne({
    projectId,
  });

  if (!integration) {
    return res.status(404).json({
      message: "GitHub not connected for this project",
    });
  }

  let commits;

  try {
    commits = await fetchCommits(
      integration.repoOwner,
      integration.repoName,
      integration.accessToken || null
    );
  } catch (error) {
    return res.status(502).json({
      message: error.message,
    });
  }

  let saved = 0;

  for (const c of commits) {
    const userId = await resolveUser(c);

    await Contribution.findOneAndUpdate(
      {
        commitId: c.commitId,
      },
      {
        projectId,
        userId,
        commitMessage: c.message || null,
        authorName: c.author || "Unknown",
        githubUsername: c.githubUsername || null,
        commitUrl: c.url || null,
        repoOwner: integration.repoOwner,
        repoName: integration.repoName,
        timestamp: c.timestamp,
        actionType: "github_commit",
        weight: 1,
      },
      {
        upsert: true,
        new: true,
      }
    );

    saved++;
  }

  res.status(200).json({
    success: true,
    message: "Commits synced successfully",
    saved,
  });
});

export const getProjectContributions = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({
      message: "Invalid projectId",
    });
  }

  const chartData = await Contribution.aggregate([
    {
      $match: {
        projectId: new mongoose.Types.ObjectId(projectId),
        actionType: "github_commit",
      },
    },
    {
      $group: {
        _id: "$userId",
        commits: {
          $sum: 1,
        },
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
      $sort: {
        commits: -1,
      },
    },
  ]);

  const detailedCommits = await Contribution.find({
    projectId,
    actionType: "github_commit",
  })
    .populate("userId", "name email githubUsername")
    .sort({ timestamp: -1 })
    .lean();

  const detailed = detailedCommits.map((commit) => ({
    id: commit._id,
    commitMessage: commit.commitMessage,
    authorName: commit.authorName,
    githubUsername: commit.githubUsername,
    commitUrl: commit.commitUrl,
    repoOwner: commit.repoOwner,
    repoName: commit.repoName,
    timestamp: commit.timestamp,
    mappedUser: commit.userId
      ? {
          id: commit.userId._id,
          name: commit.userId.name,
          email: commit.userId.email,
          githubUsername: commit.userId.githubUsername,
        }
      : null,
  }));

  res.status(200).json({
    success: true,
    chartData,
    detailed,
  });
});