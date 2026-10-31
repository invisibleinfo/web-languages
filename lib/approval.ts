import { parseCsvRecords, type CsvRecord } from "./csv";
import { urlVariants } from "./known-links";
import type { ParsedIssue } from "./submission-issue";

type Decision = { issue: number; decidedAt: string };

function toRecord(parsed: ParsedIssue, url: string, note: string, { issue, decidedAt }: Decision): CsvRecord {
  return {
    language_id: parsed.languageId,
    url,
    note,
    ui_locale: parsed.uiLocale,
    decided_at: decidedAt,
    issue: String(issue),
  };
}

/** Rows to add to accepted.csv for an approved issue. Links already in
 * the file for that language (a double submission, or an earlier approval)
 * are skipped and returned in `duplicates`. */
export function approvedRecords(
  parsed: ParsedIssue,
  existingCsv: string,
  decision: Decision,
): { records: CsvRecord[]; duplicates: string[] } {
  const known = new Set(
    parseCsvRecords(existingCsv)
      .filter((row) => row.language_id === parsed.languageId)
      .flatMap((row) => urlVariants(row.url)),
  );

  const records: CsvRecord[] = [];
  const duplicates: string[] = [];
  for (const { url, note } of parsed.links) {
    if (known.has(url)) {
      duplicates.push(url);
      continue;
    }
    for (const variant of urlVariants(url)) known.add(variant);
    records.push(toRecord(parsed, url, note, decision));
  }
  return { records, duplicates };
}

/** Rows to add to rejected.csv for a rejected issue. */
export function rejectedRecords(parsed: ParsedIssue, decision: Decision): CsvRecord[] {
  return parsed.links.map(({ url, note }) => toRecord(parsed, url, note, decision));
}

/** The comment left on a rejected issue. */
export function rejectionComment(rejected: number): string {
  return `Recorded ${rejected} ${rejected === 1 ? "link" : "links"} in \`data/rejected.csv\`.`;
}

/** The comment left on an approved issue. */
export function approvalComment(added: number, duplicates: string[], invalid: string[]): string {
  const lines = [`Added ${added} ${added === 1 ? "link" : "links"} to \`data/accepted.csv\`.`];
  if (duplicates.length > 0) {
    lines.push("", "Skipped (already listed):", ...duplicates.map((url) => `- \`${url}\``));
  }
  if (invalid.length > 0) {
    lines.push("", "Skipped (not a valid web address):", ...invalid.map((line) => `- \`${line}\``));
  }
  return lines.join("\n");
}
