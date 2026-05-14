import axios from "axios";

export const fetchCommits = async (owner, repo, accessToken = null) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits`;

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "collabos-app",
  };

  // Use token if available (higher rate limits)
  if (accessToken) {
    headers.Authorization = `token ${accessToken}`;
  }

  try {
    const response = await axios.get(url, {
      headers,
      params: { per_page: 100 },
      timeout: 15000,
    });

    return response.data.map((item) => ({
      commitId: item.sha,
      message: item.commit.message,
      author: item.commit.author.name,
      authorEmail: item.commit.author.email,
      // GitHub API author object (linked GitHub account) — more reliable for mapping
      githubUsername: item.author?.login || null,
      timestamp: item.commit.author.date,
    }));
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      if (status === 404) {
        throw new Error(`Repository ${owner}/${repo} not found or is private`);
      }
      if (status === 403) {
        const remaining = error.response.headers["x-ratelimit-remaining"];
        if (remaining === "0") {
          throw new Error("GitHub API rate limit exceeded. Try again later.");
        }
        throw new Error("GitHub API access forbidden. Check repository permissions.");
      }
    }
    throw new Error(`Failed to fetch commits: ${error.message}`);
  }
};