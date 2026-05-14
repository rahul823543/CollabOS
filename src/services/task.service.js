import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import { callGemini } from "../utils/Gemini.js";

const normalizeWeights = (count) => {
  if (count <= 0) return [];

  const base = Math.floor(100 / count);
  let remainder = 100 - base * count;

  return Array.from({ length: count }, () => {
    const weight = remainder > 0 ? base + 1 : base;
    if (remainder > 0) remainder--;
    return weight;
  });
};

const buildPrompt = (tasks, users) => `
You are a project manager.

Assign tasks to team members based on skills.

STRICT RULES:
1. Every task must be assigned to a valid user.
2. TOTAL weight across ALL tasks MUST equal EXACTLY 100.
3. Each task weight must be realistic.
4. Return ONLY JSON array.

Example:
[
  { "index": 0, "assignedTo": "userId", "weight": 35 },
  { "index": 1, "assignedTo": "userId", "weight": 25 }
]

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

const sanitizeAIResults = (results, validUserIds, taskCount) => {
  const fallbackWeights = normalizeWeights(taskCount);

  let cleaned = results.map((r, i) => ({
    index: r.index ?? i,
    assignedTo: validUserIds.has(String(r.assignedTo))
      ? r.assignedTo
      : null,
    weight:
      typeof r.weight === "number" &&
      r.weight >= 1 &&
      r.weight <= 100
        ? r.weight
        : fallbackWeights[i],
  }));

  const total = cleaned.reduce((sum, t) => sum + t.weight, 0);

  if (total !== 100) {
    cleaned = cleaned.map((t, i) => ({
      ...t,
      weight: fallbackWeights[i],
    }));
  }

  return cleaned;
};

export const createTasksFromAI = async (
  tasks,
  projectId,
  overrides = []
) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const team = await Team.findById(project.teamId)
    .populate("members", "name skills");

  if (!team) throw new Error("Team not found");

  const users = team.members;
  const validUserIds = new Set(
    users.map((u) => u._id.toString())
  );

  let aiResults;

  try {
    const raw = await callGemini(buildPrompt(tasks, users));
    const cleaned = raw
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("No JSON array found");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      throw new Error("Invalid AI format");
    }

    aiResults = sanitizeAIResults(
      parsed,
      validUserIds,
      tasks.length
    );

  } catch (err) {
    console.error("Gemini failed:", err.message);

    const fallbackWeights = normalizeWeights(tasks.length);

    aiResults = tasks.map((_, i) => ({
      index: i,
      assignedTo:
        users.length > 0
          ? users[i % users.length]._id
          : null,
      weight: fallbackWeights[i],
    }));
  }

  const finalMap = applyOverrides(aiResults, overrides);

  const created = [];

  for (let i = 0; i < tasks.length; i++) {
    const merged = finalMap[i] || {};

    const safeAssignedTo =
      merged.assignedTo &&
      validUserIds.has(String(merged.assignedTo))
        ? merged.assignedTo
        : null;

    const task = await Task.create({
      title: tasks[i].title,
      type: tasks[i].type || "other",
      project: projectId,
      assignedTo: safeAssignedTo,
      weight: merged.weight,
      deadline: merged.deadline || null,
    });

    created.push(task);
  }

  return created;
};