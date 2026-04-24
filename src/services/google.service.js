import { google } from "googleapis";
import oauth2Client from "../config/googleOAuth.js";
import GoogleIntegration from "../models/GoogleIntegration.js";

export const getGoogleAuthURL = (userId, projectId) => {
    const state = JSON.stringify({
        userId,
        projectId,
    });

    return oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.readonly",
        ],
        state,
    });
};

export const saveGoogleTokens = async (code, state) => {
    const parsedState = JSON.parse(state);

    const { userId, projectId } = parsedState;

    const { tokens } = await oauth2Client.getToken(code);

    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
        auth: oauth2Client,
        version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();

    const existing = await GoogleIntegration.findOne({
        userId,
    });

    if (existing) {
        existing.googleEmail = userInfo.data.email;
        existing.accessToken = tokens.access_token;
        existing.refreshToken =
            tokens.refresh_token || existing.refreshToken;

        await existing.save();

        return existing;
    }

    return await GoogleIntegration.create({
        userId,
        projectId,
        googleEmail: userInfo.data.email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
    });
};

export const fetchGoogleFiles = async (userId) => {
    const integration = await GoogleIntegration.findOne({
        userId,
        provider: "google",
    });

    if (!integration) {
        throw new Error("Google account not connected");
    }

    oauth2Client.setCredentials({
        access_token: integration.accessToken,
        refresh_token: integration.refreshToken,
    });

    const drive = google.drive({
        version: "v3",
        auth: oauth2Client,
    });

    const response = await drive.files.list({
        pageSize: 10,
        fields: "files(id, name, mimeType, modifiedTime)",
        orderBy: "modifiedTime desc",
    });

    return response.data.files;
};