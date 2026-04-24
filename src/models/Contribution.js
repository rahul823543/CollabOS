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

    weight: {
      type: Number,
      default: 0,
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
