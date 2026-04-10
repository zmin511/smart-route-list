const API = "https://api.github.com";

const owner = process.env.GITHUB_OWNER || "zmin511";
const repo = process.env.GITHUB_REPO || "smart-route-list";
const branch = process.env.GITHUB_BRANCH || "main";
const token = process.env.GITHUB_TOKEN;

function requireToken() {
  if (!token) {
    throw new Error("Missing GITHUB_TOKEN");
  }

  return token;
}

function headers() {
  return {
    Authorization: `Bearer ${requireToken()}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
  };
}

export async function getRepoFile(path: string) {
  const response = await fetch(`${API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: headers(),
    cache: "no-store"
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub read failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function updateRepoFile(params: {
  path: string;
  content: string;
  message: string;
  sha?: string;
}) {
  const body = {
    message: params.message,
    content: Buffer.from(params.content, "utf8").toString("base64"),
    branch,
    sha: params.sha
  };

  const response = await fetch(`${API}/repos/${owner}/${repo}/contents/${params.path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub write failed: ${response.status} ${text}`);
  }

  return response.json();
}

export function decodeBase64(content: string) {
  return Buffer.from(content.replace(/\n/g, ""), "base64").toString("utf8");
}
