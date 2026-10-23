import type { LanguageRecord, LanguageType } from "./languages";
import { parseLanguageMarkdown, type RepoLink } from "./repo-markdown";

/** The upstream repo's category folders; each is also a LanguageType. */
export const CATEGORY_FOLDERS = [
  "living",
  "extinct",
  "historical",
  "constructed",
  "special",
] as const satisfies readonly LanguageType[];

/** Upstream files that don't state an ISO code themselves. Checked only
 * when the file has none, so an upstream fix wins automatically. */
const CODE_OVERRIDES: Record<string, string> = {
  "living/low_german.md": "nds",
};

export type UpstreamFile = {
  folder: LanguageType;
  /** File name inside the folder, e.g. "welsh.md". */
  file: string;
  content: string;
};

export type LanguageList = {
  /** Every language upstream lists, by ISO code. `refName` is the name the
   * upstream repo gives it, which is what the site shows. */
  languages: LanguageRecord[];
  /** Known links per language, sorted by address. Languages with none are absent. */
  links: Map<string, RepoLink[]>;
  /** Files that were skipped or merged, worded for the build log. */
  warnings: string[];
};

function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Builds the site's language list and known links from the upstream
 * repo's per-language markdown files. The upstream repo is the source of
 * truth: each file names its language, its other names and its ISO code. */
export function buildLanguageList(files: UpstreamFile[]): LanguageList {
  const languages = new Map<string, LanguageRecord>();
  const linksByLanguage = new Map<string, Map<string, RepoLink>>();
  const warnings: string[] = [];

  for (const { folder, file, content } of files) {
    const where = `${folder}/${file}`;
    const parsed = parseLanguageMarkdown(content);

    if (!parsed.displayName) {
      warnings.push(`${where}: skipped, no "Web Language:" heading`);
      continue;
    }
    const id = parsed.isoCode ?? CODE_OVERRIDES[where];
    if (!id) {
      warnings.push(`${where} (${parsed.displayName}): skipped, no ISO-639-3 code`);
      continue;
    }

    const existing = languages.get(id);
    if (existing) {
      warnings.push(`${where}: shares code "${id}" with "${existing.refName}"; merged into it`);
    }
    const record = existing ?? {
      id,
      refName: parsed.displayName,
      altNames: [],
      languageType: folder,
    };
    languages.set(id, record);

    // Other names, minus repeats and the display name itself.
    const known = new Set([record.refName, ...record.altNames].map((name) => name.toLowerCase()));
    for (const name of parsed.additionalNames.map((n) => n.trim())) {
      if (name && !known.has(name.toLowerCase())) {
        known.add(name.toLowerCase());
        record.altNames.push(name);
      }
    }

    const links = linksByLanguage.get(id) ?? new Map<string, RepoLink>();
    for (const link of parsed.links) {
      if (!links.has(link.url)) links.set(link.url, link);
    }
    linksByLanguage.set(id, links);
  }

  const links = new Map<string, RepoLink[]>();
  for (const [id, byUrl] of linksByLanguage) {
    if (byUrl.size > 0) {
      links.set(id, [...byUrl.values()].sort((a, b) => byCodeUnit(a.url, b.url)));
    }
  }

  return {
    languages: [...languages.values()].sort((a, b) => byCodeUnit(a.id, b.id)),
    links,
    warnings,
  };
}
