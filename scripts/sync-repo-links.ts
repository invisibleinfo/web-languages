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
 *   public/all-links.csv                every link in one file, for the moderator
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
import { mkdtemp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as tar from "tar";
import { allLinksCsv, mergeAccepted } from "../lib/all-links";
import { buildLanguageList, CATEGORY_FOLDERS, type UpstreamFile } from "../lib/language-list";

const TARBALL_URL =
  "https://github.com/commoncrawl/web-languages/archive/refs/heads/main.tar.gz";
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const LINKS_DIR = path.join(PUBLIC_DIR, "repo-links");
const ACCEPTED_CSV = path.join(__dirname, "..", "data", "accepted.csv");

async function readAcceptedCsv(): Promise<string> {
  try {
    return await readFile(ACCEPTED_CSV, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
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

async function readUpstreamFiles(repoRoot: string): Promise<UpstreamFile[]> {
  const files: UpstreamFile[] = [];
  for (const folder of CATEGORY_FOLDERS) {
    const folderPath = path.join(repoRoot, folder);
    let names: string[];
    try {
      names = (await readdir(folderPath)).filter(
        (f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md",
      );
    } catch {
      continue;
    }
    for (const file of names) {
      files.push({ folder, file, content: await readFile(path.join(folderPath, file), "utf-8") });
    }
  }
  return files;
}

async function main() {
  const workDir = await mkdtemp(path.join(tmpdir(), "web-languages-"));
  try {
    const tarballPath = path.join(workDir, "repo.tar.gz");
    console.log("Downloading commoncrawl/web-languages tarball...");
    await downloadTarball(tarballPath);

    console.log("Extracting...");
    await tar.extract({ file: tarballPath, cwd: workDir });
    const files = await readUpstreamFiles(await findExtractedRepoRoot(workDir));

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
    await writeFile(path.join(PUBLIC_DIR, "all-links.csv"), allLinksCsv(links, acceptedCsv), "utf-8");
    await writeFile(
      path.join(PUBLIC_DIR, "stats.json"),
      JSON.stringify({ languagesWithSources }),
      "utf-8",
    );

    console.log(
      "Wrote public/language-list.json, public/repo-links/, public/all-links.csv and public/stats.json.",
    );
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
