export type RepoLink = {
  url: string;
  note: string | null;
};

export type ParsedLanguageFile = {
  displayName: string | null;
  /** The ISO-639-3 code the file states about itself, lowercased. */
  isoCode: string | null;
  additionalNames: string[];
  links: RepoLink[];
};

// The repo groups links under these headings; this app doesn't keep the
// grouping, but they still mark which bullets are links.
const LINK_SECTIONS = new Set([
  "news",
  "culture / history",
  "government",
  "political parties",
  "other",
]);

const BULLET_LINE = /^-\s*(.*)$/;
const ISO_CODE_LINE = /^-\s*ISO-639-3 code:\s*([a-z]{3})\s*$/i;
const URL_WITH_OPTIONAL_NOTE = /^(https?:\/\/\S+?)(?:\s+\(([^)]+)\))?\s*$/;
// A standalone "Title Case:" line is a section heading. Deliberately loose
// (any short line of letters/spaces/slash/parens ending in a colon) rather
// than a fixed list of known headings: the real template's maintainer-only
// sections don't all use predictable wording (the credits section is
// literally "Thank you to these people who have helped create this
// document:"), and treating an unrecognized heading as "not a category"
// resets state instead of silently leaking bullets into the previous
// known category.
const HEADING_LINE = /^[A-Za-z][A-Za-z /()]{0,60}:$/;

function normalizeHeading(line: string): string | null {
  return HEADING_LINE.test(line) ? line.slice(0, -1).trim().toLowerCase() : null;
}

/** Parses one `web-languages` per-language markdown file into the fields
 * contributors submit through this app. Maintainer-only sections
 * (informative links, credits, etc.) are recognized so they terminate the
 * previous section but are never themselves collected. */
export function parseLanguageMarkdown(content: string): ParsedLanguageFile {
  const lines = content.split(/\r?\n/);

  let displayName: string | null = null;
  let isoCode: string | null = null;
  const additionalNames: string[] = [];
  const links: RepoLink[] = [];
  let currentSection: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    if (displayName === null) {
      const headingMatch = line.match(/^#\s*Web Language:\s*(.+)$/i);
      if (headingMatch) {
        displayName = headingMatch[1].trim();
        continue;
      }
    }

    const heading = normalizeHeading(line);
    if (heading !== null) {
      currentSection = heading;
      continue;
    }

    const isoMatch = line.match(ISO_CODE_LINE);
    if (isoMatch) {
      isoCode ??= isoMatch[1].toLowerCase();
      continue;
    }

    const bulletMatch = line.match(BULLET_LINE);
    if (!bulletMatch || currentSection === null) continue;
    const bulletContent = bulletMatch[1].trim();
    if (bulletContent.length === 0) continue;

    if (currentSection === "additional names") {
      additionalNames.push(bulletContent);
      continue;
    }

    if (!LINK_SECTIONS.has(currentSection)) continue;

    const urlMatch = bulletContent.match(URL_WITH_OPTIONAL_NOTE);
    if (!urlMatch) continue;

    links.push({
      url: urlMatch[1],
      note: urlMatch[2] ?? null,
    });
  }

  return { displayName, isoCode, additionalNames, links };
}
