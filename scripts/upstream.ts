/**
 * Downloads the commoncrawl/web-languages repo as a single tarball (avoids
 * GitHub's unauthenticated rate limit — ~7,900 individual file fetches
 * would blow through it) and reads every per-language file. Shared by
 * sync-repo-links.ts and refresh-all-links.ts.
 */
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import * as tar from "tar";
import { CATEGORY_FOLDERS, type UpstreamFile } from "../lib/language-list";

const TARBALL_URL =
  "https://github.com/commoncrawl/web-languages/archive/refs/heads/main.tar.gz";

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

/** Downloads and extracts the upstream repo and returns every language file. */
export async function fetchUpstreamFiles(): Promise<UpstreamFile[]> {
  const workDir = await mkdtemp(path.join(tmpdir(), "web-languages-"));
  try {
    const tarballPath = path.join(workDir, "repo.tar.gz");
    console.log("Downloading commoncrawl/web-languages tarball...");
    await downloadTarball(tarballPath);

    console.log("Extracting...");
    await tar.extract({ file: tarballPath, cwd: workDir });
    return await readUpstreamFiles(await findExtractedRepoRoot(workDir));
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
