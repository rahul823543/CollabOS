import Task from "../models/Task.js";
import User from "../models/User.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import { callGemini } from "../utils/Gemini.js";

const buildPrompt = (tasks, users) => `
You are a project manager. Assign tasks to users based on their skills.
Ensure every user gets at least one task.
Return ONLY valid JSON, no explanation, no markdown.

Format:
[{ "index": 0, "assignedTo": "userId", "weight": 50 }]

Users:
${users.map(u => `- id: ${u._id}, skills: ${u.skills.join(", ")}`).join("\n")}

Tasks:
${tasks.map((t, i) => `- index: ${i}, title: ${t.title}, type: ${t.type}`).join("\n")}
`;

const applyOverrides = (aiResults, overrides) => {
  const map = Object.fromEntries(aiResults.map(r => [r.index, r]));
  for (const o of overrides) {
    if (!map[o.index]) continue;
    if (o.assignedTo !== undefined) map[o.index].assignedTo = o.assignedTo;
    if (o.weight !== undefined) map[o.index].weight = o.weight;
    if (o.deadline !== undefined) map[o.index].deadline = o.deadline;
  }
  return map;
};

export const createTasksFromAI = async (tasks, projectId, overrides = []) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const team = await Team.findById(project.teamId).populate("members", "name skills");
  if (!team) throw new Error("Team not found");

  const users = team.members;

  let aiResults;
  try {
    const raw = await callGemini(buildPrompt(tasks, users));
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    aiResults = JSON.parse(cleaned);
    if (!Array.isArray(aiResults)) throw new Error("Invalid format");
  } catch (err) {
    console.error("Gemini failed:", err);
    aiResults = tasks.map((_, i) => ({
      index: i,
      assignedTo: users[i % users.length]?._id || null,
      weight: 50,
    }));
  }

  const finalMap = applyOverrides(aiResults, overrides);

  const created = [];
  for (let i = 0; i < tasks.length; i++) {
    const merged = finalMap[i] || {};
    const task = await Task.create({
      title: tasks[i].title,
      type: tasks[i].type || "other",
      project: projectId,
      assignedTo: merged.assignedTo || null,
      weight: merged.weight ?? 50,
      deadline: merged.deadline || null,
    });
    created.push(task);
  }

  return created;
};