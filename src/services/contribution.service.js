import mongoose from "mongoose";
import Task from "../models/Task.js";
import Contribution from "../models/Contribution.js";
import User from "../models/User.js";
import Project from "../models/Project.js";

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT EARNED CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate Weight Earned (WE) for a completed task.
 *
 * Formula:  WE = WA × QualityFactor × TimeFactor
 *
 * QualityFactor : 0.75–1  (always 1 for now; future → Gemini proof analysis)
 * TimeFactor    : 1   if completed before/on deadline
 *                 0.9 if completed after deadline
 *
 * @param {number} weightAssigned - WA stored on the task
 * @param {Date|string|null} deadline - task deadline
 * @returns {{ weightEarned: number, qualityFactor: number, timeFactor: number }}
 */
export const calculateWE = (weightAssigned, deadline) => {
  const qualityFactor = 1; // Future: Gemini analysis of proof/commit quality
  const timeFactor = deadline && new Date() > new Date(deadline) ? 0.9 : 1;
  const weightEarned = parseFloat(
    (weightAssigned * qualityFactor * timeFactor).toFixed(2)
  );
  return { weightEarned, qualityFactor, timeFactor };
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HELPER — Full Task Detail Object  (Page 3 of design)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the standardised task-detail object used by both endpoints.
 *
 * Includes:
 *  1. taskId                6. weightAssigned (WA)
 *  2. title (task goal)     7. weightEarned   (WE)
 *  3. status DONE/NOT DONE  8. userPerformance = (WE/WA)×100
 *  4. projectId             9. category + type-specific detail fields
 *  5. assignedTo { userId, userName }
 */
const buildTaskDetail = (task, assignedUser) => {
  const detail = {
    taskId: task._id,
    title: task.title,
    status: task.status === "done" ? "DONE" : "NOT DONE",
    projectId: task.projectId?._id ?? task.projectId,
    assignedTo: assignedUser
      ? { userId: assignedUser._id, userName: assignedUser.name }
      : null,
    weightAssigned: task.weightAssigned || 0,
    weightEarned:   task.weightEarned   || 0,
    userPerformance: task.userPerformance || 0,
    category: task.category || "code_work",
    deadline: task.deadline || null,
  };

  // Type-specific fields (Page 3, points 9a & 9b)
  if (detail.category === "document_work") {
    detail.googleDriveFileId = task.googleDriveFileId || null;
  } else {
    // code_work (frontend / backend / devops / design / other)
    detail.commitCount        = task.commitCount        || 0;
    detail.lastCommitId       = task.lastCommitId       || null;
    detail.lastCommitMessage  = task.lastCommitMessage  || null;
  }

  return detail;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contributions/project/:projectId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns:
 *  - Project id, title, description (goal), status (from DB)
 *  - Top performers            → sorted by total WE earned
 *  - mostActiveCodeWorkUser    → highest commits, code_work task users only
 *  - leastActiveCodeWorkUser   → lowest commits, code_work task users only
 *  - percentTaskCompleted      → sum of weightAssigned of DONE tasks (out of 100)
 *  - lateTasks                 → deadline passed + status ≠ done
 *  - tasks                     → full Page-3 detail for every task in project
 */
export const getProjectContributions = async (projectId) => {
  const objectId = new mongoose.Types.ObjectId(projectId);

  // ── 1. Project ─────────────────────────────────────────────────────────
  const project = await Project.findById(objectId).lean();
  if (!project) throw { status: 404, message: "Project not found" };

  // ── 2. All tasks ────────────────────────────────────────────────────────
  const tasks = await Task.find({ projectId: objectId })
    .populate("assignedTo", "name email")
    .lean();

  const now = new Date();

  // ── 3. Late tasks ───────────────────────────────────────────────────────
  const lateTasks = tasks
    .filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== "done"
    )
    .map((t) => ({
      taskId: t._id,
      title: t.title,
      assignedTo: t.assignedTo
        ? { userId: t.assignedTo._id, userName: t.assignedTo.name }
        : null,
      deadline: t.deadline,
      daysOverdue: Math.floor(
        (now - new Date(t.deadline)) / (1000 * 60 * 60 * 24)
      ),
    }));

  // ── 4. % Task Completed = sum of weightAssigned of DONE tasks ───────────
  //   Since ΣWA = 100 for a project, this naturally gives a percentage.
  const percentTaskCompleted = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.weightAssigned || 0), 0);

  // ── 5. Commit counts from Contribution model (all users, project-wide) ──
  const allCommitAgg = await Contribution.aggregate([
    { $match: { projectId: objectId, actionType: "commit" } },
    {
      $group: {
        _id: "$userId",
        commits: { $sum: 1 },
      },
    },
  ]);

  const commitMap = {}; // userId → commit count
  let totalCommits = 0;

  for (const entry of allCommitAgg) {
    commitMap[entry._id?.toString()] = entry.commits;
    totalCommits += entry.commits;
  }

  // ── 6. Top performers — sum WE per user across all their tasks ──────────
  const weByUser = {};
  const userInfoMap = {}; // userId → { _id, name }

  for (const t of tasks) {
    if (!t.assignedTo) continue;
    const uid = t.assignedTo._id.toString();
    userInfoMap[uid] = t.assignedTo;
    if (t.status === "done") {
      weByUser[uid] = (weByUser[uid] || 0) + (t.weightEarned || 0);
    }
  }

  const topPerformers = Object.entries(weByUser)
    .map(([uid, we]) => ({
      userId:       userInfoMap[uid]._id,
      userName:     userInfoMap[uid].name,
      weightEarned: parseFloat(we.toFixed(2)),
    }))
    .sort((a, b) => b.weightEarned - a.weightEarned);

  // ── 7. Most / Least active — code_work task users only, by commits ──────
  //   Get unique user IDs who have at least one code_work task
  const codeWorkUserIds = [
    ...new Set(
      tasks
        .filter((t) => t.category === "code_work" && t.assignedTo)
        .map((t) => t.assignedTo._id.toString())
    ),
  ];

  const codeWorkActivity = codeWorkUserIds
    .map((uid) => ({
      userId:   userInfoMap[uid]._id,
      userName: userInfoMap[uid].name,
      commits:  commitMap[uid] || 0,
    }))
    .sort((a, b) => b.commits - a.commits);

  const mostActiveCodeWorkUser  = codeWorkActivity.length > 0
    ? codeWorkActivity[0]
    : null;

  const leastActiveCodeWorkUser = codeWorkActivity.length > 1
    ? codeWorkActivity[codeWorkActivity.length - 1]
    : null;

  // ── 8. Full task details for every task in the project ─────────────────
  const allTaskDetails = tasks.map((t) =>
    buildTaskDetail(t, t.assignedTo || null)
  );

  // ── 9. Summary counts ───────────────────────────────────────────────────
  const totalTasks     = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;

  return {
    success: true,
    project: {
      id:          project._id,
      title:       project.title,
      description: project.description || null, // project goal
      status:      project.status,              // read directly from DB
    },
    summary: {
      totalTasks,
      completedTasks,
      percentTaskCompleted,         // weight-based (sum of WA of done tasks)
      totalCommits,
      topPerformers,                // sorted by WE
      mostActiveCodeWorkUser,       // highest commits among code_work users
      leastActiveCodeWorkUser,      // lowest commits among code_work users
      lateTasks: {
        count: lateTasks.length,
        tasks: lateTasks,
      },
    },
    tasks: allTaskDetails,          // full Page-3 detail for all tasks
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/contributions/user/:userId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns:
 *  - userId, userName  (no email — per design Page 4)
 *  - Full Page-3 task detail for every task assigned to this user
 *  - overallStats: totalTasks, completedTasks, totalWeightAssigned, totalWeightEarned
 */
export const getUserContributions = async (userId) => {
  const objectId = new mongoose.Types.ObjectId(userId);

  // ── 1. Verify user — return userId + userName only (no email) ──────────
  const user = await User.findById(objectId).select("name skills").lean();
  if (!user) throw { status: 404, message: "User not found" };

  // ── 2. All tasks assigned to this user ─────────────────────────────────
  const tasks = await Task.find({ assignedTo: objectId })
    .populate("projectId", "title description deadline status")
    .lean();

  // ── 3. Full task detail for each task ──────────────────────────────────
  const assignedUser = { _id: user._id, name: user.name };

  const taskDetails = tasks.map((t) => {
    const detail = buildTaskDetail(t, assignedUser);
    // Attach project context so caller knows which project this task belongs to
    detail.project = t.projectId
      ? { projectId: t.projectId._id, title: t.projectId.title }
      : null;
    return detail;
  });

  // ── 4. Overall stats ────────────────────────────────────────────────────
  const totalTasks          = tasks.length;
  const completedTasks      = tasks.filter((t) => t.status === "done").length;
  const totalWeightAssigned = tasks.reduce(
    (sum, t) => sum + (t.weightAssigned || 0),
    0
  );
  const totalWeightEarned   = parseFloat(
    tasks.reduce((sum, t) => sum + (t.weightEarned || 0), 0).toFixed(2)
  );

  return {
    success: true,
    user: {
      _id:  user._id,   // userId
      name: user.name,  // userName  (no email per design)
    },
    tasks: taskDetails,
    overallStats: {
      totalTasks,
      completedTasks,
      totalWeightAssigned,
      totalWeightEarned,
    },
  };
};
