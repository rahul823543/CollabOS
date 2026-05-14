import {
  getGoogleAuthURL,
  saveGoogleTokens,
  fetchGoogleFiles
} from "../services/google.service.js";
import asyncHandler from "../utils/asyncHandler.js";

export const connectGoogle = asyncHandler(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required",
    });
  }

  const url = getGoogleAuthURL(req.user._id, projectId);

  res.status(200).json({
    success: true,
    url,
  });
});

export const googleCallback = async (req, res) => {
  const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";

  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect(
        `${frontendUrl}/google?google=error&reason=missing_code`
      );
    }

    if (!state) {
      return res.redirect(
        `${frontendUrl}/google?google=error&reason=missing_state`
      );
    }

    let parsedState;

    try {
      parsedState = JSON.parse(state);
    } catch {
      return res.redirect(
        `${frontendUrl}/google?google=error&reason=invalid_state`
      );
    }

    if (!parsedState.userId) {
      return res.redirect(
        `${frontendUrl}/google?google=error&reason=missing_user`
      );
    }

    await saveGoogleTokens(code, state);

    return res.redirect(
      `${frontendUrl}/google?google=success&projectId=${parsedState.projectId || ""}`
    );

  } catch (error) {
    console.error("Google callback error:", error.message);

    return res.redirect(
      `${frontendUrl}/google?google=error&reason=callback_failed`
    );
  }
};

export const getGoogleFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required",
    });
  }

  const files = await fetchGoogleFiles(req.user._id, projectId);

  res.status(200).json({
    success: true,
    files,
  });
});