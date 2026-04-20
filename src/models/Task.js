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
      enum: ["frontend", "backend", "devops", "design", "other"],
      default: "other",
    },

    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },

    deadline: {
      type: Date,
    },
    weight: {
  type: Number,
  min: 1,
  max: 100,
  default: 50,
},
    
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Task", taskSchema);