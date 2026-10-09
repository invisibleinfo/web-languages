import type { Locale } from "./locales";
import type { Messages } from "./messages/en";

// One dynamic import per language, so the browser only downloads the
// language it switches to.
const loaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  en: () => import("./messages/en"),
  zh: () => import("./messages/zh"),
  es: () => import("./messages/es"),
  id: () => import("./messages/id"),
  pt: () => import("./messages/pt"),
  fr: () => import("./messages/fr"),
  ja: () => import("./messages/ja"),
  ru: () => import("./messages/ru"),
  de: () => import("./messages/de"),
  hi: () => import("./messages/hi"),
};

export async function loadMessages(locale: Locale): Promise<Messages> {
  return (await loaders[locale]()).default;
}
