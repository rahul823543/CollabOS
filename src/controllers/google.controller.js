import {
  getGoogleAuthURL,
  saveGoogleTokens,
  fetchGoogleFiles
} from "../services/google.service.js";

export const connectGoogle = async (req, res) => {
  try {
    const { projectId } = req.body;

    const url = getGoogleAuthURL(req.user._id, projectId);

    res.status(200).json({
      success: true,
      url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    // important safety check
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Missing Google auth code",
      });
    }

    await saveGoogleTokens(code, state);

    res.status(200).json({
      success: true,
      message: "Google connected successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getGoogleFiles = async (req, res) => {
  try {
    const files = await fetchGoogleFiles(req.user._id);

    res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};