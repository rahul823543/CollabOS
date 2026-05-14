import mongoose from "mongoose";

const googleIntegrationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
        },

        provider: {
            type: String,
            default: "google",
        },

        googleEmail: {
            type: String,
            required: true,
        },

        accessToken: {
            type: String,
            required: true,
        },

        refreshToken: {
            type: String,
            default: null,
        },

        folderId: {
            type: String,
            default: null,
        },

        connectedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model(
    "GoogleIntegration",
    googleIntegrationSchema
);