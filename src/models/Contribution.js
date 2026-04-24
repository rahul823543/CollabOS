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

    commitId: {
      type: String,
      sparse: true,
      unique: true, // 🔥 important for upsert
    },

    commitMessage: {
      type: String,
      trim: true,
    },

    authorName: {
      type: String,
    },

    timestamp: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Contribution", contributionSchema);
