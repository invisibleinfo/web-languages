import { formatCsvRow, parseCsvRecords, type CsvRecord } from "./csv";
import { urlVariants } from "./known-links";
import type { RepoLink } from "./repo-markdown";

export const ALL_LINKS_HEADER = "language_id,url,note,source,decided_at,issue";

function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Approved links, newest first (accepted.csv is only ever appended to). */
function acceptedNewestFirst(acceptedCsv: string): CsvRecord[] {
  return parseCsvRecords(acceptedCsv).reverse();
}

/** The upstream links with the approved ones in front, newest first. An
 * approved link that upstream has since added is listed once. */
export function mergeAccepted(
  upstream: Map<string, RepoLink[]>,
  acceptedCsv: string,
): Map<string, RepoLink[]> {
  const added = new Map<string, RepoLink[]>();
  const known = new Map<string, Set<string>>();
  for (const row of acceptedNewestFirst(acceptedCsv)) {
    let seen = known.get(row.language_id);
    if (!seen) {
      seen = new Set((upstream.get(row.language_id) ?? []).flatMap((link) => urlVariants(link.url)));
      known.set(row.language_id, seen);
    }
    if (seen.has(row.url)) continue;
    for (const variant of urlVariants(row.url)) seen.add(variant);
    added.set(row.language_id, [...(added.get(row.language_id) ?? []), { url: row.url, note: row.note || null }]);
  }

  const merged = new Map(upstream);
  for (const [id, links] of added) merged.set(id, [...links, ...(upstream.get(id) ?? [])]);
  return merged;
}

/** Every link in one file for the moderator: approved ones first for each
 * language, then upstream. Rejected links are deliberately not included,
 * since this file is served publicly. */
export function allLinksCsv(upstream: Map<string, RepoLink[]>, acceptedCsv: string): string {
  const accepted = new Map<string, CsvRecord[]>();
  for (const row of acceptedNewestFirst(acceptedCsv)) {
    accepted.set(row.language_id, [...(accepted.get(row.language_id) ?? []), row]);
  }

  const lines = [ALL_LINKS_HEADER];
  for (const id of [...new Set([...upstream.keys(), ...accepted.keys()])].sort(byCodeUnit)) {
    for (const row of accepted.get(id) ?? []) {
      lines.push(formatCsvRow([id, row.url, row.note, "accepted", row.decided_at, row.issue]));
    }
    for (const link of upstream.get(id) ?? []) {
      lines.push(formatCsvRow([id, link.url, link.note ?? "", "upstream", "", ""]));
    }
  }
  return lines.join("\n") + "\n";
}
