/** The interface languages, in dropdown order. Each label is written in
 * its own language so people can find theirs without reading English. */
export const LOCALES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "es", label: "Español" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "pt", label: "Português" },
  { code: "fr", label: "Français" },
  { code: "ja", label: "日本語" },
  { code: "ru", label: "Русский" },
  { code: "de", label: "Deutsch" },
  { code: "hi", label: "हिन्दी" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const LOCALE_CODES = LOCALES.map((l) => l.code) as [Locale, ...Locale[]];

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALE_CODES as string[]).includes(value);
}

/** Browsers still send "in" for Indonesian in some places. */
const ALIASES: Record<string, Locale> = { in: "id" };

/** Picks the interface language from an `Accept-Language` header: the
 * visitor's most preferred language we support, else English. Only the
 * base language matters ("hi-IN" → "hi", "zh-TW" → "zh"). */
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith("q="));
      const quality = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim().toLowerCase(), quality: Number.isNaN(quality) ? 0 : quality, index };
    })
    .filter((entry) => entry.tag.length > 0 && entry.quality > 0)
    // Higher quality first; ties keep the order the browser sent them in.
    .sort((a, b) => b.quality - a.quality || a.index - b.index);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    const locale = ALIASES[base] ?? base;
    if (isLocale(locale)) return locale;
  }
  return DEFAULT_LOCALE;
}
