import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseCsvRecords } from "./csv";

/** The same address with and without a trailing slash, so
 * "https://a.com/x" and "https://a.com/x/" count as one link. */
export function urlVariants(url: string): string[] {
  return url.endsWith("/") ? [url, url.slice(0, -1)] : [url, `${url}/`];
}

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await readFile(file, "utf-8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** Every link already known for a language, in both slash variants: the
 * upstream list (public/repo-links/<id>.json, written at build time) plus
 * links approved since (data/accepted.csv). `languageId` must already
 * be validated — it becomes part of a file name. */
export async function readKnownUrls(
  languageId: string,
  root: string = process.cwd(),
): Promise<Set<string>> {
  const [upstream, approved] = await Promise.all([
    readIfExists(path.join(root, "public", "repo-links", `${languageId}.json`)),
    readIfExists(path.join(root, "data", "accepted.csv")),
  ]);

  const urls = [
    ...(upstream ? (JSON.parse(upstream) as { url: string }[]).map((row) => row.url) : []),
    ...(approved
      ? parseCsvRecords(approved)
          .filter((row) => row.language_id === languageId)
          .map((row) => row.url)
      : []),
  ];
  return new Set(urls.flatMap(urlVariants));
}
