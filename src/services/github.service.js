import axios from "axios";

export const fetchCommits = async (owner, repo) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/commits`;

  const response = await axios.get(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "collabos-app",
    },
  });

  return response.data.map((item) => ({
    commitId: item.sha,
    message: item.commit.message,
    author: item.commit.author.name,
    timestamp: item.commit.author.date,
  }));
};