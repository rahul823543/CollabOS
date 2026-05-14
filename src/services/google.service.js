import { google } from "googleapis";
import GoogleIntegration from "../models/GoogleIntegration.js";

const createOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

export const getGoogleAuthURL = (userId, projectId) => {
  const state = JSON.stringify({
    userId,
    projectId,
  });

  const client = createOAuth2Client();

  return client.generateAuthUrl({
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

  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);

  client.setCredentials(tokens);

  const oauth2 = google.oauth2({
    auth: client,
    version: "v2",
  });

  const userInfo = await oauth2.userinfo.get();

  const existing = await GoogleIntegration.findOne({
    userId,
    projectId,
    provider: "google",
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
    provider: "google",
    googleEmail: userInfo.data.email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token || null,
  });
};

export const fetchGoogleFiles = async (userId, projectId) => {
  const integration = await GoogleIntegration.findOne({
    userId,
    projectId,
    provider: "google",
  });

  if (!integration) {
    throw new Error("Google account not connected for this project");
  }

  const client = createOAuth2Client();

  client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  const drive = google.drive({
    version: "v3",
    auth: client,
  });

  const response = await drive.files.list({
    pageSize: 20,
    fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
    q: `
      trashed=false and (
        mimeType='application/pdf' or
        mimeType='application/vnd.google-apps.document' or
        mimeType='application/vnd.google-apps.spreadsheet' or
        mimeType='application/vnd.google-apps.presentation' or
        mimeType contains 'text'
      )
    `,
    orderBy: "modifiedTime desc",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  return response.data.files || [];
};