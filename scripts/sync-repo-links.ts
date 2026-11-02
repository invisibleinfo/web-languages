/**
 * Downloads the commoncrawl/web-languages repo as a single tarball (avoids
 * GitHub's unauthenticated rate limit — ~7,900 individual file fetches
 * would blow through it), reads every per-language file, and writes the
 * static files the site serves:
 *
 *   public/language-list.json           every language: code, name, other names, category
 *   public/repo-links/<iso-code>.json   [{ url, note }]: links approved here
 *                                       (data/accepted.csv, newest first), then
 *                                       the upstream ones sorted by url
 *   public/all-links.csv                a copy of data/all-links.csv (not rebuilt here)
 *   public/stats.json                   { languagesWithSources }
 *
 * The upstream repo is the only source: each file names its language and
 * states its own ISO-639-3 code. Runs automatically before `npm run build`
 * (see the `prebuild` script), so every deploy picks up what changed
 * upstream. The output is gitignored; run it once by hand for local
 * development.
 *
 *   npm run sync-repo-links
 */
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { mergeAccepted } from "../lib/all-links";
import { buildLanguageList } from "../lib/language-list";
import { fetchUpstreamFiles } from "./upstream";

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LINKS_DIR = path.join(PUBLIC_DIR, "repo-links");
const ACCEPTED_CSV = path.join(__dirname, "..", "data", "accepted.csv");
const ALL_LINKS_CSV = path.join(__dirname, "..", "data", "all-links.csv");

async function readAcceptedCsv(): Promise<string> {
  try {
    return await readFile(ACCEPTED_CSV, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

async function main() {
  const files = await fetchUpstreamFiles();

  const { languages, links, warnings } = buildLanguageList(files);
  const linkCount = [...links.values()].reduce((sum, list) => sum + list.length, 0);
  console.log(
    `Read ${files.length} files: ${languages.length} languages, ` +
      `${links.size} with links (${linkCount} links in all).`,
  );
  for (const warning of warnings) console.warn(`  ! ${warning}`);

  // An empty result would ship a site that lists nothing; fail the build instead.
  if (languages.length === 0 || links.size === 0) {
    throw new Error("Parsed no languages or links from the upstream repo; aborting.");
  }

  // Links approved here show up on the site too, in front of the upstream ones.
  const acceptedCsv = await readAcceptedCsv();
  const shown = mergeAccepted(links, acceptedCsv);
  const languageIds = new Set(languages.map((language) => language.id));
  const languagesWithSources = [...shown.keys()].filter((id) => languageIds.has(id)).length;

  // Only this script's own generated folder is cleared, so languages dropped
  // upstream don't linger.
  await rm(LINKS_DIR, { recursive: true, force: true });
  await mkdir(LINKS_DIR, { recursive: true });
  for (const [languageId, list] of shown) {
    await writeFile(path.join(LINKS_DIR, `${languageId}.json`), JSON.stringify(list), "utf-8");
  }
  await writeFile(path.join(PUBLIC_DIR, "language-list.json"), JSON.stringify(languages), "utf-8");
  // The moderator's file is kept in the repo and rebuilt by the approval
  // Action and `npm run refresh-all-links`; a deploy only serves a copy.
  const hasAllLinks = await copyFile(ALL_LINKS_CSV, path.join(PUBLIC_DIR, "all-links.csv")).then(
    () => true,
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return false;
      throw error;
    },
  );
  if (!hasAllLinks) console.warn("  ! data/all-links.csv is missing; run `npm run refresh-all-links`.");
  await writeFile(
    path.join(PUBLIC_DIR, "stats.json"),
    JSON.stringify({ languagesWithSources }),
    "utf-8",
  );

  console.log(
    "Wrote public/language-list.json, public/repo-links/, public/stats.json and a copy of data/all-links.csv.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
