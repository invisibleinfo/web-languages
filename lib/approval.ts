import { parseCsvRecords, type CsvRecord } from "./csv";
import { urlVariants } from "./known-links";
import type { ParsedIssue, ReviewedLink } from "./submission-issue";

/** `issue` is the issue's web address. */
type Decision = { issue: string; decidedAt: string };

function toRecord(parsed: ParsedIssue, link: ReviewedLink, { issue, decidedAt }: Decision): CsvRecord {
  return {
    language_id: parsed.languageId,
    url: link.url,
    note: link.note,
    ui_locale: parsed.uiLocale,
    decided_at: decidedAt,
    issue,
  };
}

/** Rows to add to accepted.csv for the ticked links. Links already in the
 * file for that language (a double submission, or an earlier approval) are
 * skipped and returned in `duplicates`. */
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
  for (const link of parsed.links.filter((link) => link.checked)) {
    if (known.has(link.url)) {
      duplicates.push(link.url);
      continue;
    }
    for (const variant of urlVariants(link.url)) known.add(variant);
    records.push(toRecord(parsed, link, decision));
  }
  return { records, duplicates };
}

/** Rows to add to rejected.csv: the unticked links, or with `all` every link
 * (an issue closed as "not planned"). */
export function rejectedRecords(
  parsed: ParsedIssue,
  decision: Decision,
  { all = false } = {},
): CsvRecord[] {
  return parsed.links.filter((link) => all || !link.checked).map((link) => toRecord(parsed, link, decision));
}

const links = (count: number) => `${count} ${count === 1 ? "link" : "links"}`;

/** The comment left on a validated issue. */
export function validationComment(
  added: number,
  rejected: number,
  duplicates: string[],
  invalid: string[],
): string {
  const lines = [
    `Added ${links(added)} to \`data/accepted.csv\` and recorded ${links(rejected)} in \`data/rejected.csv\`.`,
  ];
  if (duplicates.length > 0) {
    lines.push("", "Skipped (already listed):", ...duplicates.map((url) => `- \`${url}\``));
  }
  if (invalid.length > 0) {
    lines.push("", "Skipped (not a valid web address):", ...invalid.map((line) => `- \`${line}\``));
  }
  return lines.join("\n");
}
