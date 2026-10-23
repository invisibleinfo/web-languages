/**
 * Run by .github/workflows/approve-submission.yml, not by hand. Turns a
 * reviewed submission issue into rows of a CSV file in the repo.
 *
 *   MODE=approve  issue labelled `approved` → rows appended to data/submissions.csv
 *   MODE=reject   issue closed as "not planned" → rows appended to data/rejected.csv
 *   MODE=finish   after the workflow pushed the CSV → comment on and close the issue
 *
 * Closing happens in a separate step so a failed push never leaves a closed
 * issue whose links were not saved.
 *
 * The issue text is untrusted: it is only ever parsed as data here and
 * never reaches a shell.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { approvalComment, approvedRecords, rejectedRecords } from "../lib/approval";
import { appendCsvRecords } from "../lib/csv";
import { parseIssueBody, SUBMISSION_LABEL } from "../lib/submission-issue";

// Actions sets GITHUB_API_URL itself; the fallback is for running locally.
const API = process.env.GITHUB_API_URL ?? "https://api.github.com";
const SUBMISSIONS_CSV = path.join(__dirname, "..", "data", "submissions.csv");
const REJECTED_CSV = path.join(__dirname, "..", "data", "rejected.csv");

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const repo = env("GITHUB_REPOSITORY");
const issueNumber = Number(env("ISSUE_NUMBER"));

async function github<T>(route: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}/repos/${repo}${route}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env("GITHUB_TOKEN")}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "web-languages-approval",
    },
  });
  if (!response.ok) throw new Error(`GitHub ${init.method ?? "GET"} ${route} failed: ${response.status}`);
  return (await response.json()) as T;
}

type Issue = {
  state: string;
  body: string | null;
  labels: ({ name: string } | string)[];
  pull_request?: unknown;
};

async function loadSubmission() {
  const issue = await github<Issue>(`/issues/${issueNumber}`);
  const labels = issue.labels.map((label) => (typeof label === "string" ? label : label.name));
  if (issue.pull_request || !labels.includes(SUBMISSION_LABEL)) return { issue, parsed: null };
  return { issue, parsed: parseIssueBody(issue.body ?? "") };
}

async function readCsv(file: string): Promise<string> {
  try {
    return await readFile(file, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

async function approve() {
  const sender = env("SENDER");
  const { permission } = await github<{ permission: string }>(
    `/collaborators/${encodeURIComponent(sender)}/permission`,
  );
  if (permission !== "admin" && permission !== "write") {
    console.log(`${sender} has "${permission}" access; ignoring the label.`);
    return;
  }

  const { issue, parsed } = await loadSubmission();
  if (issue.state !== "open") {
    console.log("Issue is already closed; nothing to do.");
    return;
  }
  if (!parsed) {
    await github(`/issues/${issueNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "Could not read the language, UI language and link list in this issue, so nothing was added." }),
    });
    throw new Error("Issue body is not a readable submission");
  }

  const existing = await readCsv(SUBMISSIONS_CSV);
  const { records, duplicates } = approvedRecords(parsed, existing, {
    issue: issueNumber,
    decidedAt: new Date().toISOString(),
  });
  if (records.length > 0) {
    await writeFile(SUBMISSIONS_CSV, appendCsvRecords(existing, records), "utf-8");
  }
  console.log(`Added ${records.length} link(s); skipped ${duplicates.length} duplicate(s).`);

  await writeFile(
    env("RESULT_FILE"),
    JSON.stringify({ comment: approvalComment(records.length, duplicates, parsed.invalid) }),
    "utf-8",
  );
}

async function reject() {
  const { parsed } = await loadSubmission();
  if (!parsed) {
    console.log("Not a readable submission issue; nothing to record.");
    return;
  }
  const records = rejectedRecords(parsed, { issue: issueNumber, decidedAt: new Date().toISOString() });
  await writeFile(REJECTED_CSV, appendCsvRecords(await readCsv(REJECTED_CSV), records), "utf-8");
  console.log(`Recorded ${records.length} rejected link(s).`);
}

async function finish() {
  let comment: string;
  try {
    ({ comment } = JSON.parse(await readFile(env("RESULT_FILE"), "utf-8")) as { comment: string });
  } catch {
    console.log("No approval result; leaving the issue as it is.");
    return;
  }
  await github(`/issues/${issueNumber}/comments`, { method: "POST", body: JSON.stringify({ body: comment }) });
  await github(`/issues/${issueNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed", state_reason: "completed" }),
  });
}

const modes: Record<string, () => Promise<void>> = { approve, reject, finish };

const run = modes[env("MODE")];
if (!run) throw new Error(`Unknown MODE ${process.env.MODE}`);
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
