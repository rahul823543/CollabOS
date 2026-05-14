import Task from "../models/Task.js";
import Project from "../models/Project.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  findTeamAndValidate,
  createProjectService,
  createProjectWithAIService
} from "../services/project.service.js";

export const createProject = asyncHandler(async (req, res) => {
  const { title, description, deadline, teamId } = req.body;
  if (!title || !teamId) return res.status(400).json({ message: "Title and teamId required" });
  await findTeamAndValidate(teamId, req.user._id);
  const project = await createProjectService({ title, description, deadline, teamId });
  res.status(201).json(project);
});

export const createProjectWithAI = asyncHandler(async (req, res) => {
  const { title, description, deadline, teamId, techStack } = req.body;
  if (!title || !teamId) return res.status(400).json({ message: "Title and teamId required" });
  await findTeamAndValidate(teamId, req.user._id);
  const result = await createProjectWithAIService({ title, description, deadline, teamId, techStack });
  res.status(201).json(result);
});

export const getProjectsByTeam = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  await findTeamAndValidate(teamId, req.user._id);
  const projects = await Project.find({ teamId });
  res.json(projects);
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  await findTeamAndValidate(project.teamId, req.user._id);
  const { title, description, deadline } = req.body;
  const updated = await Project.findByIdAndUpdate(req.params.id, { title, description, deadline }, { new: true });
  res.json(updated);
});

export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });
  await findTeamAndValidate(project.teamId, req.user._id);
  await Task.deleteMany({ project: req.params.id });
  await project.deleteOne();
  res.json({ message: "Project and its tasks deleted" });
});