import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    actionType: {
      type: String,
      enum: ["task_completed", "commit"],
      default: "commit",
    },

    // WA — Weight Assigned to task at time of completion
    weightAssigned: {
      type: Number,
      default: 0,
    },

    // WE — Weight Earned = WA × QualityFactor × TimeFactor
    weightEarned: {
      type: Number,
      default: 0,
    },

    // QualityFactor: 0.75–1 (currently always 1; future: Gemini proof analysis)
    qualityFactor: {
      type: Number,
      default: 1,
      min: 0.75,
      max: 1,
    },

    // TimeFactor: 1 if submitted before/on deadline, 0.9 if after
    timeFactor: {
      type: Number,
      default: 1,
    },

    proof: {
      type: String,
      default: null,
    },

    // GitHub commit fields
    commitId: {
      type: String,
      unique: true,
      sparse: true,
    },

    commitMessage: {
      type: String,
      default: null,
    },

    authorName: {
      type: String,
      default: null,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for the aggregation queries
contributionSchema.index({ projectId: 1, actionType: 1 });
contributionSchema.index({ userId: 1, actionType: 1 });

export default mongoose.model("Contribution", contributionSchema);
