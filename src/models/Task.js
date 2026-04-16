import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project"
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        title: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo",
        },
        deadline: Date,
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Task", taskSchema);