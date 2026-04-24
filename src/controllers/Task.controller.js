import { createTasksFromAI } from "../services/task.service.js";
import Task from "../models/Task.js";
import Contribution from "../models/Contribution.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyProof } from "../services/verification.service.js";

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
  if (projectId) filter.project = projectId;
  if (assignedTo) filter.assignedTo = assignedTo;
  const tasks = await Task.find(filter).populate("assignedTo", "name email skills");
  res.json(tasks);
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, proof } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  if (task.status === "done")
    return res.status(400).json({ message: "Task already completed" });

  // get team creator
  const project = await Project.findById(task.project);
  const team = await Team.findById(project.teamId);
  const isTeamCreator = team.createdBy.toString() === req.user._id.toString();
  const isAssignedUser = task.assignedTo.toString() === req.user._id.toString();

  // only assigned user or team creator can update
  if (!isAssignedUser && !isTeamCreator)
    return res.status(403).json({ message: "Not authorized to update this task" });

  if (status === "done" && !proof)
    return res.status(400).json({ message: "Proof required. Provide github_commit_id or 'manual'" });

  // only team creator can use manual proof
  if (status === "done" && proof === "manual" && !isTeamCreator)
    return res.status(403).json({ message: "Only team creator can manually approve tasks" });

  // verify github commit if not manual
  if (status === "done" && proof !== "manual") {
    const result = await verifyProof(proof, task.project);
    if (!result.valid)
      return res.status(400).json({ message: result.reason });
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, { status }, { new: true });

  if (status === "done" && updated.assignedTo) {
   await Contribution.create({
  userId: updated.assignedTo,
  taskId: updated._id,
  projectId: updated.project,
  actionType: "task_completed",
  weight: updated.weight,
  commitId: proof === "manual" ? null : proof,
});
  }

  const isLate = updated.deadline && new Date() > new Date(updated.deadline);
  res.json({ task: updated, warning: isLate ? "Task completed after deadline" : null });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json({ message: "Task deleted" });
});
