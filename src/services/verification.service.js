// services/verification.service.js
import axios from "axios";
import Integration from "../models/Integration.js";

export const verifyProof = async (proof, projectId) => {
  // manual proof — skip verification
  if (proof === "manual") return { valid: true, reason: "Manually approved" };

  // github commit verification
  const integration = await Integration.findOne({ projectId });
  if (!integration) return { valid: false, reason: "No GitHub integration found for this project" };

  try {
    const url = `https://api.github.com/repos/${integration.repoOwner}/${integration.repoName}/commits/${proof}`;
    await axios.get(url, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "collabos-app",
      },
    });
    return { valid: true, reason: "GitHub commit verified" };
  } catch (err) {
    return { valid: false, reason: "Invalid or fake GitHub commit ID" };
  }
};