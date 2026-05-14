import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    actionType: {
      type: String,
      enum: ["task_completed", "github_commit"],
      default: "github_commit",
    },

    // Task contributions
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },

    proof: {
      type: String,
      default: null,
    },

    weight: {
      type: Number,
      default: 1,
      min: 0,
    },

    // GitHub commit data
    commitId: {
      type: String,
      default: null,
    },

    commitMessage: {
      type: String,
      trim: true,
      default: null,
    },

    authorName: {
      type: String,
      default: null,
    },

    githubUsername: {
      type: String,
      default: null,
    },

    commitUrl: {
      type: String,
      default: null,
    },

    repoOwner: {
      type: String,
      default: null,
    },

    repoName: {
      type: String,
      default: null,
    },

    timestamp: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate GitHub commits
contributionSchema.index(
  { commitId: 1 },
  {
    unique: true,
    sparse: true,
  }
);

export default mongoose.model(
  "Contribution",
  contributionSchema
);