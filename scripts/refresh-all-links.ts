/**
 * Re-downloads the upstream commoncrawl/web-languages repo and rewrites
 * data/all-links.csv: the fresh upstream links, plus every link in
 * data/accepted.csv. Rejected links are never included. Commit the result.
 *
 * The approval Action only adds new approvals to the upstream rows already in
 * the file; this is the one place upstream is read again.
 *
 *   npm run refresh-all-links
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { allLinksCsv } from "../lib/all-links";
import { buildLanguageList } from "../lib/language-list";
import { fetchUpstreamFiles } from "./upstream";

const ACCEPTED_CSV = path.join(__dirname, "..", "data", "accepted.csv");
const ALL_LINKS_CSV = path.join(__dirname, "..", "data", "all-links.csv");

async function main() {
  const { links } = buildLanguageList(await fetchUpstreamFiles());
  // An empty download would wipe the saved upstream rows; keep the old file.
  if (links.size === 0) throw new Error("Parsed no links from the upstream repo; aborting.");

  const acceptedCsv = await readFile(ACCEPTED_CSV, "utf-8").catch(() => "");
  await writeFile(ALL_LINKS_CSV, allLinksCsv(links, acceptedCsv), "utf-8");
  console.log(`Wrote data/all-links.csv (${links.size} languages with upstream links).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
