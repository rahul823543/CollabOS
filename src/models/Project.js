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
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Project", projectSchema);