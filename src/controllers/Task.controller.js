import { createTasksFromAI } from "../services/task.service.js";
import Task from "../models/Task.js";
import Contribution from "../models/Contribution.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyProof } from "../services/verification.service.js";
import { calculateWE } from "../services/contribution.service.js";

export const createTask = asyncHandler(async (req, res) => {
  const { projectId, tasks, overrides } = req.body;
  if (!projectId) return res.status(400).json({ message: "projectId required" });
  if (!Array.isArray(tasks) || tasks.length === 0)
    return res.status(400).json({ message: "tasks array required" });
  const created = await createTasksFromAI(tasks, projectId, overrides || []);
  res.json({ message: "Tasks created", tasks: created });
});

export const getTasks = asyncHandler(async (req, res) => {
  const { projectId, assignedTo } = req.query;
  const filter = {};
  if (projectId) filter.projectId = projectId;
  if (assignedTo) {
    filter.assignedTo = assignedTo;
  } else if (projectId) {
    // Check if user is team creator for the project
    const project = await Project.findById(projectId);
    if (project) {
      const team = await Team.findById(project.teamId);
      if (team && team.createdBy.toString() === req.user._id.toString()) {
        // Team creator sees all tasks in the project
      } else {
        // Others see only their tasks
        filter.assignedTo = req.user._id;
      }
    } else {
      filter.assignedTo = req.user._id;
    }
  } else {
    filter.assignedTo = req.user._id;
  }
  const tasks = await Task.find(filter).populate("assignedTo", "name email skills");
  res.json(tasks);
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, proof } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (task.status === "done")
    return res.status(400).json({ message: "Task already completed" });

  // Verify team membership and permissions
  const project = await Project.findById(task.projectId);
  const team    = await Team.findById(project.teamId);
  const isTeamCreator  = team.createdBy.toString() === req.user._id.toString();
  const isAssignedUser = task.assignedTo.toString() === req.user._id.toString();

  if (!isAssignedUser && !isTeamCreator)
    return res.status(403).json({ message: "Not authorized to update this task" });

  if (status === "done" && !proof)
    return res.status(400).json({ message: "Proof required. Provide github_commit_id or 'manual'" });

  if (status === "done" && proof === "manual" && !isTeamCreator)
    return res.status(403).json({ message: "Only team creator can manually approve tasks" });

  if (status === "done" && proof !== "manual") {
    const result = await verifyProof(proof, task.projectId);
    if (!result.valid)
      return res.status(400).json({ message: result.reason });
  }

  // ── Build the update object ─────────────────────────────────────────────
  const taskUpdate = { status };

  if (status === "done") {
    // Page 2: WE = WA × QualityFactor × TimeFactor
    const { weightEarned, qualityFactor, timeFactor } = calculateWE(
      task.weightAssigned,
      task.deadline
    );

    // Page 3 (point 8): userPerformance = (WE / WA) × 100
    const userPerformance =
      task.weightAssigned > 0
        ? parseFloat(((weightEarned / task.weightAssigned) * 100).toFixed(1))
        : 0;

    taskUpdate.weightEarned   = weightEarned;
    taskUpdate.qualityFactor  = qualityFactor;
    taskUpdate.timeFactor     = timeFactor;
    taskUpdate.userPerformance = userPerformance;

    // Page 3 (point 9a): update code_work commit fields when proof is a commit ID
    if (task.category === "code_work" && proof && proof !== "manual") {
      taskUpdate.lastCommitId  = proof;
      taskUpdate.commitCount   = (task.commitCount || 0) + 1;
      // lastCommitMessage: pulled from GitHub in future via sync
    }
  }

  // ── Single DB call — update status + all completion fields together ─────
  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    taskUpdate,
    { new: true }
  );

  // ── Create Contribution record with full WE breakdown ──────────────────
  if (status === "done" && updated.assignedTo) {
    await Contribution.create({
      userId:          updated.assignedTo,
      taskId:          updated._id,
      projectId:       updated.projectId,
      actionType:      "task_completed",
      weightAssigned:  updated.weightAssigned,
      weightEarned:    updated.weightEarned,
      qualityFactor:   updated.qualityFactor,
      timeFactor:      updated.timeFactor,
      proof,
      commitId: proof === "manual" ? undefined : proof,
    });

    // Page 5: update project status when all tasks are done
    const undoneCount = await Task.countDocuments({
      projectId: updated.projectId,
      status:  { $ne: "done" },
    });

    if (undoneCount === 0) {
      await Project.findByIdAndUpdate(updated.projectId, { status: "done" });
    }
  }

  const isLate = updated.deadline && new Date() > new Date(updated.deadline);

  res.json({
    task: updated,
    warning: isLate ? "Task completed after deadline" : null,
  });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Task deleted" });
});
