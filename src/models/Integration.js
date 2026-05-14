import mongoose from "mongoose";

const integrationSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    provider: {
      type: String,
      enum: ["github"],
      default: "github",
    },

    githubUsername: {
      type: String,
      trim: true,
    },

    repoOwner: {
      type: String,
      required: true,
    },

    repoName: {
      type: String,
      required: true,
    },

    accessToken: {
      type: String, 
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Integration", integrationSchema);