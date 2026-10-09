"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES, isLocale } from "@/lib/i18n/locales";

/** Header dropdown for the interface language. A native <select>: it works
 * reliably on low-end phones and is accessible without extra code. */
export function UiLanguageSelect() {
  const { locale, messages, setLocale } = useI18n();

  return (
    <label className="relative flex items-center gap-1.5">
      <Globe className="pointer-events-none hidden h-4 w-4 shrink-0 min-[360px]:block" aria-hidden />
      <span className="sr-only">{messages.header.siteLanguage}</span>
      <select
        value={locale}
        onChange={(e) => {
          if (isLocale(e.target.value)) setLocale(e.target.value);
        }}
        className="max-w-[8.5rem] cursor-pointer appearance-none truncate border border-paper/40 bg-navy py-1 pl-2 pr-6 text-sm text-paper outline-none hover:border-paper focus-visible:border-paper"
      >
        {LOCALES.map((option) => (
          <option key={option.code} value={option.code} lang={option.code}>
            {option.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 text-xs" aria-hidden>
        ▾
      </span>
    </label>
  );
}
