/**
 * Downloads the commoncrawl/web-languages repo as a single tarball (avoids
 * GitHub's unauthenticated rate limit — ~7,900 individual file fetches
 * would blow through it), parses each language's per-file links,
 * resolves the file to an ISO-639-3 code, and writes the result as static
 * files the site serves:
 *
 *   public/repo-links/<iso-code>.json   [{ url, note }], sorted by url
 *   public/stats.json                   { languagesWithSources }
 *
 * Runs automatically before `npm run build` (see the `prebuild` script), so
 * every deploy picks up the latest upstream links. The output is
 * gitignored; run it once by hand for local development.
 *
 *   npm run sync-repo-links
 */
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import * as tar from "tar";
import languagesData from "../public/languages.json";
import { matchLanguageByName, type LanguageRecord } from "../lib/languages";
import { parseLanguageMarkdown } from "../lib/repo-markdown";

const TARBALL_URL =
  "https://github.com/commoncrawl/web-languages/archive/refs/heads/main.tar.gz";
const CATEGORY_FOLDERS = ["living", "extinct", "historical", "constructed", "special"] as const;
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LINKS_DIR = path.join(PUBLIC_DIR, "repo-links");

type RepoLinkRow = {
  language_id: string;
  url: string;
  note: string | null;
};

/** Collapses to one row per (language_id, url), keeping whichever
 * occurrence was parsed first. The source repo can list the same URL under
 * two sections in one file, or two files can resolve to the same language. */
export function dedupeRepoLinkRows(rows: RepoLinkRow[]): RepoLinkRow[] {
  const seen = new Map<string, RepoLinkRow>();
  for (const row of rows) {
    const key = `${row.language_id}\t${row.url}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
}

/** Groups rows by language, each group sorted by url. */
export function groupByLanguage(rows: RepoLinkRow[]): Map<string, { url: string; note: string | null }[]> {
  const groups = new Map<string, { url: string; note: string | null }[]>();
  for (const { language_id, url, note } of rows) {
    const group = groups.get(language_id) ?? [];
    group.push({ url, note });
    groups.set(language_id, group);
  }
  for (const group of groups.values()) group.sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0));
  return groups;
}

async function downloadTarball(destPath: string) {
  const response = await fetch(TARBALL_URL);
  if (!response.ok) {
    throw new Error(`Failed to download tarball: ${response.status} ${response.statusText}`);
  }
  await writeFile(destPath, Buffer.from(await response.arrayBuffer()));
}

async function findExtractedRepoRoot(workDir: string): Promise<string> {
  const entries = await readdir(workDir, { withFileTypes: true });
  const repoDir = entries.find((e) => e.isDirectory() && e.name.startsWith("web-languages-"));
  if (!repoDir) throw new Error("Could not find extracted repo directory in tarball");
  return path.join(workDir, repoDir.name);
}

async function main() {
  const languages = languagesData as LanguageRecord[];

  const workDir = await mkdtemp(path.join(tmpdir(), "web-languages-"));
  try {
    const tarballPath = path.join(workDir, "repo.tar.gz");
    console.log("Downloading commoncrawl/web-languages tarball...");
    await downloadTarball(tarballPath);

    console.log("Extracting...");
    await tar.extract({ file: tarballPath, cwd: workDir });
    const repoRoot = await findExtractedRepoRoot(workDir);

    const rows: RepoLinkRow[] = [];
    const unmatched: string[] = [];

    for (const folder of CATEGORY_FOLDERS) {
      const folderPath = path.join(repoRoot, folder);
      let files: string[];
      try {
        files = (await readdir(folderPath)).filter(
          (f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md",
        );
      } catch {
        continue;
      }

      for (const file of files) {
        const content = await readFile(path.join(folderPath, file), "utf-8");
        const parsed = parseLanguageMarkdown(content);
        if (!parsed.displayName) continue;

        let match: LanguageRecord | undefined;
        for (const name of [parsed.displayName, ...parsed.additionalNames]) {
          match = matchLanguageByName(name, languages);
          if (match) break;
        }

        if (!match) {
          unmatched.push(`${folder}/${file} (${parsed.displayName})`);
          continue;
        }

        for (const link of parsed.links) {
          rows.push({ language_id: match.id, url: link.url, note: link.note });
        }
      }
    }

    const dedupedRows = dedupeRepoLinkRows(rows);
    const groups = groupByLanguage(dedupedRows);

    console.log(
      `Parsed ${rows.length} links (${dedupedRows.length} unique) for ${groups.size} languages ` +
        `across ${CATEGORY_FOLDERS.length} category folders. ${unmatched.length} files unmatched.`,
    );
    if (unmatched.length > 0) {
      console.log("Unmatched files (first 20):");
      for (const u of unmatched.slice(0, 20)) console.log(`  - ${u}`);
    }

    // An empty result would ship a site that lists nothing; fail the build instead.
    if (groups.size === 0) throw new Error("Parsed no links from the upstream repo; aborting.");

    // Only this script's own generated folder is cleared, so languages dropped
    // upstream don't linger.
    await rm(LINKS_DIR, { recursive: true, force: true });
    await mkdir(LINKS_DIR, { recursive: true });
    for (const [languageId, links] of groups) {
      await writeFile(path.join(LINKS_DIR, `${languageId}.json`), JSON.stringify(links), "utf-8");
    }
    await writeFile(
      path.join(PUBLIC_DIR, "stats.json"),
      JSON.stringify({ languagesWithSources: groups.size }),
      "utf-8",
    );

    console.log(`Wrote ${groups.size} files to public/repo-links/ and public/stats.json.`);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

const isMainModule =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
