/**
 * Downloads SIL's ISO-639-3 reference tables, joins them into flat language
 * records, and writes public/languages.json (committed, fetched client-side —
 * see lib/languages.ts — rather than bundled, so it doesn't inflate the JS
 * bundle).
 *
 * Run once at setup; re-run only if SIL publishes an update.
 *   npm run seed-languages
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildLanguageRecords } from "../lib/sil-transform";

const ISO_6393_TAB_URL =
  "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3.tab";
const NAME_INDEX_TAB_URL =
  "https://iso639-3.sil.org/sites/iso639-3/files/downloads/iso-639-3_Name_Index.tab";

const OUTPUT_PATH = path.join(__dirname, "..", "public", "languages.json");

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

async function main() {
  console.log("Fetching SIL reference tables...");
  const [iso6393Tab, nameIndexTab] = await Promise.all([
    fetchText(ISO_6393_TAB_URL),
    fetchText(NAME_INDEX_TAB_URL),
  ]);

  const records = buildLanguageRecords(iso6393Tab, nameIndexTab);
  console.log(`Built ${records.length} language records.`);

  await writeFile(OUTPUT_PATH, JSON.stringify(records, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
