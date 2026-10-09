"use client";

import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { loadMessages } from "@/lib/i18n/load-messages";
import type { Locale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages/en";

type I18n = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => Promise<void>;
};

const I18nContext = createContext<I18n | null>(null);

/** Holds the interface language for the page. Starts with the language the
 * server picked from the browser's settings; the header dropdown can
 * change it until the page is closed. Nothing is stored. */
export function I18nProvider({
  initialLocale,
  initialMessages,
  children,
}: {
  initialLocale: Locale;
  initialMessages: Messages;
  children: ReactNode;
}) {
  const [state, setState] = useState({ locale: initialLocale, messages: initialMessages });
  // The most recent pick wins, even if an earlier one finishes loading later.
  const latest = useRef<Locale>(initialLocale);

  async function setLocale(locale: Locale) {
    latest.current = locale;
    try {
      const messages = await loadMessages(locale);
      if (latest.current !== locale) return;
      setState({ locale, messages });
      document.documentElement.lang = locale;
      document.title = messages.meta.title;
    } catch {
      // Offline or the file failed to load: stay on the current language.
    }
  }

  return (
    <I18nContext.Provider value={{ ...state, setLocale }}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
