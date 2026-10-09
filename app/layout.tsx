import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono } from "next/font/google";
import { headers } from "next/headers";
import { I18nProvider } from "@/components/i18n-provider";
import { loadMessages } from "@/lib/i18n/load-messages";
import { pickLocale } from "@/lib/i18n/locales";
import "./globals.css";

// One serif family for both body and headings — Cormorant Garamond's low
// x-height read as too thin for body copy, so headings and prose now share
// Fraunces instead. It's a variable font with an optical-size axis, so the
// browser renders a sturdier, more legible cut at body text sizes and a
// more expressive display cut at heading sizes automatically, rather than
// stretching one static design across both roles.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// The interface language comes from the browser's Accept-Language header
// on every request — nothing is stored (see docs/decisions.md).
async function requestLocale() {
  return pickLocale((await headers()).get("accept-language"));
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = await loadMessages(await requestLocale());
  return { title: meta.title, description: meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await requestLocale();
  const messages = await loadMessages(locale);

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <I18nProvider initialLocale={locale} initialMessages={messages}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
