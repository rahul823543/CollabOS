import { createTasksFromAI } from "../services/task.service.js";
import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Contribution from "../models/Contribution.js";
import asyncHandler from "../utils/asyncHandler.js";
import { verifyProof } from "../services/verification.service.js";
import { findTeamAndValidate } from "../services/project.service.js";
import mongoose from "mongoose";

// POST /tasks — create tasks
export const createTask = asyncHandler(async (req, res) => {
  const { projectId, tasks, overrides } = req.body;

  if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: "Valid projectId required" });
  }

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ message: "tasks array required" });
  }

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ message: "Project not found" });
  }

  await findTeamAndValidate(project.teamId, req.user._id);

  const created = await createTasksFromAI(
    tasks,
    projectId,
    overrides || []
  );

  res.json({
    message: "Tasks created",
    tasks: created,
  });
});

// GET /tasks
export const getTasks = asyncHandler(async (req, res) => {
  const { projectId, assignedTo } = req.query;
  const filter = {};

  if (projectId) {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId" });
    }

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await findTeamAndValidate(project.teamId, req.user._id);
    filter.project = projectId;
  }

  if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  const tasks = await Task.find(filter).populate(
    "assignedTo",
    "name email skills"
  );

  res.json(tasks);
});

// PUT /tasks/:id
export const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, proof } = req.body;

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  const isAssignee =
    task.assignedTo &&
    task.assignedTo.toString() === req.user._id.toString();

  const project = await Project.findById(task.project);

  if (!project) {
    return res.status(404).json({
      message: "Project not found",
    });
  }

  let isTeamCreator = false;

  try {
    const team = await findTeamAndValidate(
      project.teamId,
      req.user._id
    );

    isTeamCreator =
      team.createdBy.toString() === req.user._id.toString();
  } catch {
    return res.status(403).json({
      message: "Not authorized",
    });
  }

  if (!isAssignee && !isTeamCreator) {
    return res.status(403).json({
      message:
        "Only assigned user or team creator can update this task",
    });
  }

  if (task.status === "done") {
    return res.status(400).json({
      message: "Task already completed",
    });
  }

  if (status === "done" && !proof) {
    return res.status(400).json({
      message: "Proof required",
    });
  }

  const isGithubRepo =
    typeof proof === "string" &&
    proof.startsWith("https://github.com/");

  if (
    status === "done" &&
    proof !== "manual" &&
    !isGithubRepo
  ) {
    const result = await verifyProof(proof, task.project);

    if (!result.valid) {
      return res.status(400).json({
        message: result.reason,
      });
    }
  }

  task.status = status;
  await task.save();

  if (status === "done" && task.assignedTo) {
    await Contribution.findOneAndUpdate(
      {
        taskId: task._id,
        actionType: "task_completed",
      },
      {
        userId: task.assignedTo,
        taskId: task._id,
        projectId: task.project,
        actionType: "task_completed",
        weight: task.weight || 1,
        proof: proof || "manual",
      },
      {
        upsert: true,
        new: true,
      }
    );
  }

  const isLate =
    task.deadline &&
    new Date() > new Date(task.deadline);

  res.json({
    task,
    warning: isLate
      ? "Task completed after deadline"
      : null,
  });
});

// DELETE /tasks/:id
export const deleteTask = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      message: "Invalid task ID",
    });
  }

  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({
      message: "Task not found",
    });
  }

  const project = await Project.findById(task.project);

  if (!project) {
    return res.status(404).json({
      message: "Project not found",
    });
  }

  const team = await findTeamAndValidate(
    project.teamId,
    req.user._id
  );

  const isTeamCreator =
    team.createdBy.toString() === req.user._id.toString();

  if (!isTeamCreator && req.user.role !== "admin") {
    return res.status(403).json({
      message: "Only team creator or admin can delete tasks",
    });
  }

  await task.deleteOne();

  res.json({
    message: "Task deleted",
  });
});