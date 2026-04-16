import mongoose from "mongoose";

const contributionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    actionType: String,
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("Contribution", contributionSchema);