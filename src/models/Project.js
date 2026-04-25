import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team"
        },
        title: {
            type: String,
            required: true
        },
        description: String,
        deadline: Date,
        // "active" when created; "done" when all tasks are completed
        status: {
            type: String,
            enum: ["active", "done"],
            default: "active",
        },
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Project", projectSchema);