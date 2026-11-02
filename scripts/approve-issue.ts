/**
 * Run by .github/workflows/approve-submission.yml, not by hand. Turns a
 * reviewed submission issue into rows of CSV files in the repo.
 *
 *   MODE=validate issue labelled `validated` → ticked links appended to
 *                 data/accepted.csv, unticked ones to data/rejected.csv, and
 *                 data/all-links.csv rebuilt. Text a maintainer wrote at the
 *                 end of a link's line becomes the `reason` column.
 *   MODE=reject   issue closed as "not planned" → every link appended to
 *                 data/rejected.csv (once per issue)
 *   MODE=finish   after the workflow pushed the CSVs → comment on and close
 *                 the issue
 *
 * Closing happens in a separate step so a failed push never leaves a closed
 * issue whose links were not saved.
 *
 * The issue text is untrusted: it is only ever parsed as data here and
 * never reaches a shell.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { allLinksCsv, upstreamFromAllLinksCsv } from "../lib/all-links";
import { approvedRecords, rejectedRecords, validationComment } from "../lib/approval";
import { appendCsvRecords, parseCsvRecords } from "../lib/csv";
import { parseIssueBody, SUBMISSION_LABEL, VALIDATED_LABEL } from "../lib/submission-issue";

// Actions sets GITHUB_API_URL itself; the fallback is for running locally.
const API = process.env.GITHUB_API_URL ?? "https://api.github.com";
const ACCEPTED_CSV = path.join(__dirname, "..", "data", "accepted.csv");
const REJECTED_CSV = path.join(__dirname, "..", "data", "rejected.csv");
const ALL_LINKS_CSV = path.join(__dirname, "..", "data", "all-links.csv");

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

const repo = env("GITHUB_REPOSITORY");
const issueNumber = Number(env("ISSUE_NUMBER"));
// Hands the approve step's comment to the finish step. Actions gives every
// step RUNNER_TEMP; RESULT_FILE overrides it for local runs.
const resultFile = () => process.env.RESULT_FILE ?? path.join(env("RUNNER_TEMP"), "approval-result.json");

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
  if (issue.pull_request || !labels.includes(SUBMISSION_LABEL)) return { issue, labels, parsed: null };
  return { issue, labels, parsed: parseIssueBody(issue.body ?? "") };
}

/** Only people with write access can decide a submission; anyone else's
 * label or close is ignored. */
async function senderCanDecide(): Promise<boolean> {
  const sender = env("SENDER");
  const { permission } = await github<{ permission: string }>(
    `/collaborators/${encodeURIComponent(sender)}/permission`,
  );
  if (permission === "admin" || permission === "write") return true;
  console.log(`${sender} has "${permission}" access; ignoring this.`);
  return false;
}

async function readCsv(file: string): Promise<string> {
  try {
    return await readFile(file, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

async function validate() {
  if (!(await senderCanDecide())) return;

  const { issue, parsed } = await loadSubmission();
  if (issue.state !== "open") {
    console.log("Issue is already closed; nothing to do.");
    return;
  }
  if (!parsed) {
    await github(`/issues/${issueNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: "Could not read the language, UI language and link list in this issue, so nothing was recorded." }),
    });
    throw new Error("Issue body is not a readable submission");
  }

  const acceptedCsv = await readCsv(ACCEPTED_CSV);
  const rejectedCsv = await readCsv(REJECTED_CSV);
  // A run that pushed but failed to close the issue: don't record it twice.
  if (isRecorded(acceptedCsv) || isRecorded(rejectedCsv)) {
    console.log("Issue is already recorded; only closing it.");
    await writeResult("Already recorded in the CSV files; closing this issue.");
    return;
  }

  const decision = { issue: issueNumber, decidedAt: new Date().toISOString() };
  const { records: accepted, duplicates } = approvedRecords(parsed, acceptedCsv, decision);
  const rejected = rejectedRecords(parsed, decision);

  const newAccepted = accepted.length > 0 ? appendCsvRecords(acceptedCsv, accepted) : acceptedCsv;
  if (accepted.length > 0) await writeFile(ACCEPTED_CSV, newAccepted, "utf-8");
  if (rejected.length > 0) await writeFile(REJECTED_CSV, appendCsvRecords(rejectedCsv, rejected), "utf-8");
  await rebuildAllLinks(newAccepted);
  console.log(
    `Accepted ${accepted.length} link(s), rejected ${rejected.length}; skipped ${duplicates.length} duplicate(s).`,
  );

  await writeResult(validationComment(accepted.length, rejected.length, duplicates, parsed.invalid));
}

/** Whether a decisions file already has rows for this issue. */
function isRecorded(csv: string): boolean {
  return parseCsvRecords(csv).some((row) => row.issue === String(issueNumber));
}

/** Rewrites data/all-links.csv from the upstream rows it already holds plus
 * every accepted link. Upstream is not downloaded here; see
 * scripts/refresh-all-links.ts. */
async function rebuildAllLinks(acceptedCsv: string) {
  const upstream = upstreamFromAllLinksCsv(await readCsv(ALL_LINKS_CSV));
  await writeFile(ALL_LINKS_CSV, allLinksCsv(upstream, acceptedCsv), "utf-8");
}

async function writeResult(comment: string) {
  await writeFile(resultFile(), JSON.stringify({ comment }), "utf-8");
}

/** An issue closed as "not planned": every link is rejected, ticked or not. */
async function reject() {
  if (!(await senderCanDecide())) return;

  const { labels, parsed } = await loadSubmission();
  if (!parsed) {
    console.log("Not a readable submission issue; nothing to record.");
    return;
  }
  if (labels.includes(VALIDATED_LABEL)) {
    console.log("Issue is validated; not recording a rejection.");
    return;
  }
  const acceptedCsv = await readCsv(ACCEPTED_CSV);
  const existing = await readCsv(REJECTED_CSV);
  if (isRecorded(acceptedCsv) || isRecorded(existing)) {
    console.log("Issue is already recorded; nothing to do.");
    return;
  }

  const records = rejectedRecords(
    parsed,
    { issue: issueNumber, decidedAt: new Date().toISOString() },
    { all: true },
  );
  await writeFile(REJECTED_CSV, appendCsvRecords(existing, records), "utf-8");
  console.log(`Recorded ${records.length} rejected link(s).`);
}

async function finish() {
  let comment: string;
  try {
    ({ comment } = JSON.parse(await readFile(resultFile(), "utf-8")) as { comment: string });
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

const modes: Record<string, () => Promise<void>> = { validate, reject, finish };

const run = modes[env("MODE")];
if (!run) throw new Error(`Unknown MODE ${process.env.MODE}`);
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
