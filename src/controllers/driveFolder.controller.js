import GoogleIntegration from "../models/GoogleIntegration.js";
import oauth2Client from "../config/googleOAuth.js";
import { google } from "googleapis";
import asyncHandler from "../utils/asyncHandler.js";

export const linkFolder = asyncHandler(async (req, res) => {
  const { projectId, folderId } = req.body;
  if (!projectId || !folderId)
    return res.status(400).json({ message: "projectId and folderId required" });

  const integration = await GoogleIntegration.findOneAndUpdate(
    { projectId },
    { folderId },
    { new: true }
  );

  if (!integration)
    return res.status(404).json({ message: "Google not connected for this project" });

  res.json({ success: true, integration });
});

export const getFolderMetadata = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const integration = await GoogleIntegration.findOne({ projectId });
  if (!integration || !integration.folderId)
    return res.status(404).json({ message: "No folder linked to this project" });

  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const folder = await drive.files.get({
    fileId: integration.folderId,
    fields: "id, name, owners, modifiedTime"
  });

  const files = await drive.files.list({
    q: `'${integration.folderId}' in parents`,
    fields: "files(id, name)"
  });

  res.json({
    success: true,
    folderName: folder.data.name,
    filesCount: files.data.files.length,
    owner: folder.data.owners?.[0]?.displayName,
    lastModified: folder.data.modifiedTime
  });
});