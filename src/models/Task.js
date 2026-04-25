import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Granular task type — frontend/backend/etc. are code work; document_work is doc work
    type: {
      type: String,
      enum: ["frontend", "backend", "devops", "design", "other", "document_work"],
      default: "other",
    },

    // Derived from type at creation: "code_work" for all types except "document_work"
    category: {
      type: String,
      enum: ["code_work", "document_work"],
      default: "code_work",
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    // Required — every task must have a deadline (enforced at DB level)
    deadline: {
      type: Date,
      required: true,
    },

    // ── WA: Weight Assigned ─────────────────────────────────────────────
    // Set by AI at task creation. ΣWA across all tasks in a project = 100
    weightAssigned: {
      type: Number,
      min: 1,
      max: 100,
      default: 50,
    },

    // ── WE: Weight Earned = WA × QualityFactor × TimeFactor ────────────
    // Calculated and stored when task is marked done
    weightEarned: {
      type: Number,
      default: 0,
    },

    // QualityFactor: 0.75–1 (always 1 for now; future: Gemini proof analysis)
    qualityFactor: {
      type: Number,
      default: 1,
      min: 0.75,
      max: 1,
    },

    // TimeFactor: 1 if completed before/on deadline, 0.9 if after
    timeFactor: {
      type: Number,
      default: 1,
    },

    // User performance on this task = (WE / WA) × 100, stored at completion
    userPerformance: {
      type: Number,
      default: 0,
    },

    // ── Code Work fields (populated when category = "code_work") ────────
    commitCount: {
      type: Number,
      default: 0,
    },

    lastCommitId: {
      type: String,
      default: null,
    },

    lastCommitMessage: {
      type: String,
      default: null,
    },

    // ── Document Work field (populated when category = "document_work") ─
    googleDriveFileId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);