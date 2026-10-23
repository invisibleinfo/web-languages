import "server-only";
import type { IssueDraft } from "./submission-issue";

/** The credential used to talk to GitHub. Today a personal fine-grained
 * token from the environment; a GitHub App would mint a short-lived
 * installation token here instead, and nothing else would change. */
export function getGithubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  return token;
}

function getRepo(): string {
  const repo = process.env.GITHUB_REPO;
  const valid =
    repo && /^[\w.-]+\/[\w.-]+$/.test(repo) && !repo.split("/").some((part) => /^\.+$/.test(part));
  if (!repo || !valid) {
    throw new Error("GITHUB_REPO must look like owner/name");
  }
  return repo;
}

/** Opens one issue in GITHUB_REPO. Throws on any failure; the message
 * carries the status only, never the token or the response body. */
export async function createIssue(draft: IssueDraft): Promise<void> {
  const response = await fetch(`https://api.github.com/repos/${getRepo()}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGithubToken()}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "web-languages",
    },
    body: JSON.stringify(draft),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`GitHub issue creation failed with status ${response.status}`);
}
