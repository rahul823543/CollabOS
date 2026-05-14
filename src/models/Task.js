import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    project: {
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

    type: {
      type: String,
      enum: ["frontend", "backend", "devops", "design", "document_work", "other"],
      default: "other",
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    deadline: {
      type: Date,
      default: null,
    },

    weight: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);