export type LanguageType = "living" | "extinct" | "historical" | "constructed" | "special";

export type LanguageRecord = {
  /** ISO-639-3 code. */
  id: string;
  /** The name the web-languages repo gives the language; what the site shows. */
  refName: string;
  /** Other names for it, searchable but not shown as the title. */
  altNames: string[];
  languageType: LanguageType;
};

let cache: LanguageRecord[] | null = null;
let inflight: Promise<LanguageRecord[]> | null = null;

/** Fetches the language list (built from the web-languages repo by
 * scripts/sync-repo-links.ts into public/language-list.json) as a plain
 * static asset — not a module import — so it's a separately cacheable network
 * request that doesn't inflate the client JS bundle or gate hydration on a
 * ~0.5MB JSON parse. Cached in memory after the first successful call;
 * concurrent callers before that share one in-flight request. */
export function loadLanguages(): Promise<LanguageRecord[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/language-list.json")
      .then((response) => response.json() as Promise<LanguageRecord[]>)
      .then((data) => {
        cache = data;
        inflight = null;
        return data;
      })
      .catch((error) => {
        inflight = null;
        throw error;
      });
  }
  return inflight;
}

/** Test-only: clears the module-level cache so each test starts fresh. */
export function __resetLanguagesCacheForTests(): void {
  cache = null;
  inflight = null;
}
