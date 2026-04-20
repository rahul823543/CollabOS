import Project from "../models/Project.js";
import Task from "../models/Task.js";
import Team from "../models/Team.js";
import { generateTasks } from "./ai.service.js";
import { createTasksFromAI } from "./task.service.js";

export const isTeamMember = (team, userId) => {
  return team.members.some(
    (member) => member.toString() === userId.toString()
  );
};

export const findTeamAndValidate = async (teamId, userId) => {
  const team = await Team.findById(teamId);
  if (!team) throw { status: 404, message: "Team not found" };
  if (!isTeamMember(team, userId)) throw { status: 403, message: "Not authorized" };
  return team;
};

export const createProjectService = async ({ title, description, deadline, teamId }) => {
  return await Project.create({ title, description, deadline, teamId });
};

export const createProjectWithAIService = async ({ title, description, deadline, teamId, techStack }) => {
  const project = await Project.create({ title, description, deadline, teamId });
  const aiTasks = await generateTasks({ projectTitle: title, description, techStack });
  const tasks = await createTasksFromAI(aiTasks, project._id, []);
  return { project, tasks };
};