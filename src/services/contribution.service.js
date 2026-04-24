import mongoose from "mongoose";
import Task from "../models/Task.js";
import Contribution from "../models/Contribution.js";
import User from "../models/User.js";
import Project from "../models/Project.js";

/**
 * GET /contribution/project/:projectId
 *
 * Returns:
 *  - Users on the project with their assigned tasks
 *  - Task status (DONE / NOT DONE) per user
 *  - Weights completed (%) per user
 *  - Top performers (by commit count)
 *  - Last active user
 *  - Total commits
 *  - Late tasks (deadline passed, status !== done)
 */
export const getProjectContributions = async (projectId) => {
  const objectId = new mongoose.Types.ObjectId(projectId);

  // ── 1. Fetch project details ───────────────────────────────────────
  const project = await Project.findById(objectId).lean();
  if (!project) throw { status: 404, message: "Project not found" };

  // ── 2. Fetch all tasks for this project ────────────────────────────
  const tasks = await Task.find({ project: objectId })
    .populate("assignedTo", "name email")
    .lean();

  const now = new Date();

  // ── 3. Late tasks (deadline passed + status ≠ done) ────────────────
  const lateTasks = tasks
    .filter((t) => t.deadline && new Date(t.deadline) < now && t.status !== "done")
    .map((t) => ({
      taskId: t._id,
      title: t.title,
      assignedTo: t.assignedTo
        ? { name: t.assignedTo.name, email: t.assignedTo.email }
        : null,
      deadline: t.deadline,
      daysOverdue: Math.floor(
        (now - new Date(t.deadline)) / (1000 * 60 * 60 * 24)
      ),
    }));

  // ── 4. Group tasks by user ─────────────────────────────────────────
  const userMap = {};

  for (const t of tasks) {
    const uid = t.assignedTo?._id?.toString() || "unassigned";

    if (!userMap[uid]) {
      userMap[uid] = {
        user: t.assignedTo || null,
        tasks: [],
        totalWeight: 0,
        completedWeight: 0,
      };
    }

    userMap[uid].tasks.push({
      taskId: t._id,
      title: t.title,
      status: t.status === "done" ? "DONE" : "NOT DONE",
      weight: t.weight,
      deadline: t.deadline || null,
    });

    userMap[uid].totalWeight += t.weight || 0;
    if (t.status === "done") {
      userMap[uid].completedWeight += t.weight || 0;
    }
  }

  // ── 5. Commit counts per user (from Contribution model) ────────────
  const commitAgg = await Contribution.aggregate([
    {
      $match: {
        projectId: objectId,
        actionType: "commit",
      },
    },
    {
      $group: {
        _id: "$userId",
        commits: { $sum: 1 },
        lastActivity: { $max: "$timestamp" },
      },
    },
  ]);

  const commitMap = {};
  let totalCommits = 0;
  let lastActiveEntry = null;

  for (const entry of commitAgg) {
    const uid = entry._id?.toString() || "unassigned";
    commitMap[uid] = entry.commits;
    totalCommits += entry.commits;

    if (
      !lastActiveEntry ||
      (entry.lastActivity && entry.lastActivity > lastActiveEntry.lastActivity)
    ) {
      lastActiveEntry = entry;
    }
  }

  // ── 6. Also count task_completed contributions for commit-less users
  const taskCompletedAgg = await Contribution.aggregate([
    {
      $match: {
        projectId: objectId,
        actionType: "task_completed",
      },
    },
    {
      $group: {
        _id: "$userId",
        lastActivity: { $max: "$timestamp" },
      },
    },
  ]);

  // Check if any task_completed entry is more recent
  for (const entry of taskCompletedAgg) {
    if (
      !lastActiveEntry ||
      (entry.lastActivity && entry.lastActivity > lastActiveEntry.lastActivity)
    ) {
      lastActiveEntry = entry;
    }
  }

  // ── 7. Build the users array ───────────────────────────────────────
  const users = [];

  for (const [uid, data] of Object.entries(userMap)) {
    if (uid === "unassigned") continue;

    const weightsCompleted =
      data.totalWeight > 0
        ? parseFloat(
            ((data.completedWeight / data.totalWeight) * 100).toFixed(1)
          )
        : 0;

    users.push({
      user: data.user,
      tasks: data.tasks,
      weightsCompleted,
      commits: commitMap[uid] || 0,
    });
  }

  // ── 8. Top performers (sorted by commits) ──────────────────────────
  const topPerformers = [...users]
    .filter((u) => u.commits > 0)
    .sort((a, b) => b.commits - a.commits)
    .map((u) => ({
      user: u.user,
      commits: u.commits,
    }));

  // ── 9. Resolve last active user ────────────────────────────────────
  let lastActiveUser = null;
  if (lastActiveEntry && lastActiveEntry._id) {
    const user = await User.findById(lastActiveEntry._id)
      .select("name email")
      .lean();
    lastActiveUser = user
      ? { name: user.name, email: user.email, lastActivity: lastActiveEntry.lastActivity }
      : null;
  }

  // ── 10. Summary ────────────────────────────────────────────────────
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const overallProgress =
    totalTasks > 0
      ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1))
      : 0;

  return {
    success: true,
    project: {
      id: project._id,
      title: project.title,
    },
    summary: {
      totalTasks,
      completedTasks,
      overallProgress,
      totalCommits,
      lateTasks: {
        count: lateTasks.length,
        tasks: lateTasks,
      },
      topPerformers,
      lastActiveUser,
    },
    users,
  };
};

/**
 * GET /contribution/user/:userId
 *
 * Returns:
 *  - All projects the user is working on / worked on
 *  - Tasks per project with weights, status
 *  - Commit count per project
 */
export const getUserContributions = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  // ── 1. Verify user exists ──────────────────────────────────────────
  const user = await User.findById(objectId).select("name email skills").lean();
  if (!user) throw { status: 404, message: "User not found" };

  // ── 2. Get all tasks assigned to this user ─────────────────────────
  const tasks = await Task.find({ assignedTo: objectId })
    .populate("project", "title description deadline")
    .lean();

  // ── 3. Group tasks by project ──────────────────────────────────────
  const projectMap = {};

  for (const t of tasks) {
    const pid = t.project?._id?.toString();
    if (!pid) continue;

    if (!projectMap[pid]) {
      projectMap[pid] = {
        project: t.project,
        tasks: [],
        totalWeight: 0,
        completedWeight: 0,
      };
    }

    projectMap[pid].tasks.push({
      taskId: t._id,
      title: t.title,
      weight: t.weight,
      status: t.status === "done" ? "DONE" : "NOT DONE",
      deadline: t.deadline || null,
    });

    projectMap[pid].totalWeight += t.weight || 0;
    if (t.status === "done") {
      projectMap[pid].completedWeight += t.weight || 0;
    }
  }

  // ── 4. Commit counts per project for this user ─────────────────────
  const commitAgg = await Contribution.aggregate([
    {
      $match: {
        userId: objectId,
        actionType: "commit",
      },
    },
    {
      $group: {
        _id: "$projectId",
        commits: { $sum: 1 },
      },
    },
  ]);

  const commitMap = {};
  let totalCommitsOverall = 0;

  for (const entry of commitAgg) {
    commitMap[entry._id.toString()] = entry.commits;
    totalCommitsOverall += entry.commits;
  }

  // ── 5. Build projects array ────────────────────────────────────────
  const projects = [];

  for (const [pid, data] of Object.entries(projectMap)) {
    const weightsCompleted =
      data.totalWeight > 0
        ? parseFloat(
            ((data.completedWeight / data.totalWeight) * 100).toFixed(1)
          )
        : 0;

    projects.push({
      project: {
        _id: data.project._id,
        title: data.project.title,
      },
      tasks: data.tasks,
      totalWeightAssigned: data.totalWeight,
      weightsCompleted,
      commits: commitMap[pid] || 0,
    });
  }

  // ── 6. Overall stats ───────────────────────────────────────────────
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;

  return {
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
    },
    projects,
    overallStats: {
      totalProjects: projects.length,
      totalTasks,
      completedTasks,
      totalCommits: totalCommitsOverall,
    },
  };
};
