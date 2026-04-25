import Task from "../models/Task.js";
import Project from "../models/Project.js";
import Team from "../models/Team.js";
import { callGemini } from "../utils/Gemini.js";

// Fallback deadline used when Gemini fails to return one: 7 days from now
const getFallbackDeadline = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const buildPrompt = (tasks, users) => `
You are a project manager. Assign tasks to users based on their skills.
Ensure every user gets at least one task.
Total weightAssigned of ALL tasks combined MUST equal exactly 100.
Distribute weightAssigned based on task complexity — harder tasks get more.
Every task MUST have a deadline (ISO date string, within 30 days from today).
The "type" must be one of: "frontend", "backend", "devops", "design", "other", "document_work".
  - Use "document_work" for documentation, research, planning, and design tasks.
  - Use frontend / backend / devops / design / other for coding and engineering tasks.
Return ONLY valid JSON array, no explanation, no markdown.

Format:
[{ "index": 0, "assignedTo": "userId", "weightAssigned": 50, "type": "backend", "deadline": "2024-05-01T00:00:00.000Z" }]

Users:
${users.map(u => `- id: ${u._id}, skills: ${u.skills.join(", ")}`).join("\n")}

Tasks:
${tasks.map((t, i) => `- index: ${i}, title: ${t.title}, type: ${t.type || "other"}`).join("\n")}
`;

const normalizeWeights = (results) => {
  const total = results.reduce((sum, r) => sum + (r.weightAssigned || 0), 0);
  if (total === 0) return results;
  return results.map(r => ({
    ...r,
    weightAssigned: Math.round((r.weightAssigned / total) * 100),
  }));
};

const applyOverrides = (aiResults, overrides) => {
  const map = Object.fromEntries(aiResults.map(r => [r.index, r]));
  for (const o of overrides) {
    if (!map[o.index]) continue;
    if (o.assignedTo      !== undefined) map[o.index].assignedTo      = o.assignedTo;
    if (o.weightAssigned  !== undefined) map[o.index].weightAssigned  = o.weightAssigned;
    if (o.deadline        !== undefined) map[o.index].deadline        = o.deadline;
    if (o.type            !== undefined) map[o.index].type            = o.type;
  }
  const values = Object.values(map);
  const normalized = normalizeWeights(values);
  normalized.forEach((r, i) => (map[Object.keys(map)[i]] = r));
  return map;
};

export const createTasksFromAI = async (tasks, projectId, overrides = []) => {
  const project = await Project.findById(projectId);
  if (!project) throw new Error("Project not found");

  const team = await Team.findById(project.teamId).populate("members", "name skills");
  if (!team) throw new Error("Team not found");

  const users = team.members;
  const fallbackDeadline = getFallbackDeadline();
  const equalWeight = Math.floor(100 / tasks.length);

  let aiResults;
  try {
    const raw     = await callGemini(buildPrompt(tasks, users));
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    aiResults     = JSON.parse(cleaned);
    if (!Array.isArray(aiResults)) throw new Error("Invalid format");
    aiResults     = normalizeWeights(aiResults);
  } catch (err) {
    console.error("Gemini failed:", err);
    // Fallback: distribute tasks evenly, assign deadline 7 days from now
    aiResults = tasks.map((t, i) => ({
      index:          i,
      assignedTo:     users[i % users.length]?._id || null,
      weightAssigned: equalWeight,
      type:           t.type || "other",
      deadline:       fallbackDeadline,
    }));
  }

  const finalMap = applyOverrides(aiResults, overrides);

  const created = [];
  for (let i = 0; i < tasks.length; i++) {
    const merged = finalMap[i] || {};

    // Resolve task type: user-provided takes priority, then AI suggestion
    const resolvedType = tasks[i].type || merged.type || "other";

    // Derive category from type: document_work → "document_work", all else → "code_work"
    const category = resolvedType === "document_work" ? "document_work" : "code_work";

    const task = await Task.create({
      title:          tasks[i].title,
      type:           resolvedType,
      category,                                            // derived from type
      projectId:      projectId,
      assignedTo:     merged.assignedTo     || null,
      weightAssigned: merged.weightAssigned ?? equalWeight,
      deadline:       merged.deadline       || fallbackDeadline, // always set — required
    });

    created.push(task);
  }

  return created;
};
