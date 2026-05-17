import {
  getGoogleAuthURL,
  saveGoogleTokens,
  fetchGoogleFiles,
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

  try {
    const url = getGoogleAuthURL(req.user._id, projectId);

    console.log("=== GOOGLE OAUTH DEBUG ===");
    console.log("CLIENT_URL:", process.env.CLIENT_URL);
    console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);
    console.log("GENERATED AUTH URL:", url);
    console.log("==========================");

    return res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Google connect error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Google auth URL",
    });
  }
});

export const googleCallback = asyncHandler(async (req, res) => {
  const frontendUrl =
    process.env.CLIENT_URL || "https://collab-os-frontend.vercel.app";

  const { code, state } = req.query;

  console.log("=== GOOGLE CALLBACK DEBUG ===");
  console.log("CODE:", code ? "received" : "missing");
  console.log("STATE:", state);
  console.log("============================");

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
  } catch (error) {
    console.error("State parse error:", error.message);

    return res.redirect(
      `${frontendUrl}/google?google=error&reason=invalid_state`
    );
  }

  if (!parsedState.userId) {
    return res.redirect(
      `${frontendUrl}/google?google=error&reason=missing_user`
    );
  }

  try {
    await saveGoogleTokens(code, state);

    return res.redirect(
      `${frontendUrl}/google?google=success&projectId=${
        parsedState.projectId || ""
      }`
    );
  } catch (error) {
    console.error("Google token save error:", error.message);

    return res.redirect(
      `${frontendUrl}/google?google=error&reason=callback_failed`
    );
  }
});

export const getGoogleFiles = asyncHandler(async (req, res) => {
  const { projectId } = req.query;

  if (!projectId) {
    return res.status(400).json({
      success: false,
      message: "projectId is required",
    });
  }

  const files = await fetchGoogleFiles(req.user._id, projectId);

  return res.status(200).json({
    success: true,
    files,
  });
});
