"use client";

import { Check, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguagePicker } from "@/components/language-picker";
import { Button } from "@/components/ui/button";
import { SubmissionForm } from "@/components/submission-form";
import { UiLanguageSelect } from "@/components/ui-language-select";
import { UrlList, type UrlListItem } from "@/components/url-list";
import { formatNodes, plural } from "@/lib/i18n/format";
import { loadLanguages, type LanguageRecord } from "@/lib/languages";

const FIRST_PAGE = 3;
const MORE_PAGE = 20;

type ListState = { items: UrlListItem[]; total: number; failed?: boolean };
const EMPTY_LIST: ListState = { items: [], total: 0 };

// Each language's known links are one small static file (written by
// scripts/sync-repo-links.ts), fetched once and paged through in memory.
const linkFiles = new Map<string, Promise<UrlListItem[]>>();

function loadLinkFile(languageId: string): Promise<UrlListItem[]> {
  let file = linkFiles.get(languageId);
  if (!file) {
    file = fetch(`/repo-links/${languageId}.json`).then((response) => {
      // No file means the upstream repo has no links for this language yet.
      if (response.status === 404) return [];
      if (!response.ok) throw new Error(`repo-links ${response.status}`);
      return response.json() as Promise<UrlListItem[]>;
    });
    linkFiles.set(languageId, file);
    file.catch(() => linkFiles.delete(languageId));
  }
  return file;
}

async function fetchList(languageId: string, from: number, to: number): Promise<ListState> {
  try {
    const all = await loadLinkFile(languageId);
    return { items: all.slice(from, to + 1), total: all.length };
  } catch {
    // A failed read must not look like "None yet".
    return { items: [], total: 0, failed: true };
  }
}

// A stat that isn't resolved yet shows a skeleton; one that resolved to
// "unavailable" (the stats file is missing) disappears rather than ever showing a permanent dash.
function StatStrip({
  totalLanguages,
  languagesWithSources,
  statsLoading,
}: {
  totalLanguages: number | null;
  languagesWithSources: number | null;
  statsLoading: boolean;
}) {
  const { locale, messages } = useI18n();
  const number = (value: number) => (
    <span className="font-mono tabular-data font-semibold text-ink">
      {value.toLocaleString(locale)}
    </span>
  );
  const total =
    totalLanguages === null ? (
      <span className="font-mono tabular-data font-semibold text-ink">···</span>
    ) : (
      number(totalLanguages)
    );
  const skeleton = (
    <span className="inline-block h-4 w-10 animate-pulse bg-border align-middle" aria-hidden />
  );

  // Once the source count resolved to "unavailable", show only the total.
  if (!statsLoading && languagesWithSources === null) {
    return (
      <p className="text-center text-lg text-ink-soft">
        {formatNodes(messages.home.statsTotal, { total })}
      </p>
    );
  }

  const percentReady = !statsLoading && totalLanguages !== null && totalLanguages > 0;
  const percent = percentReady
    ? number(Math.round((languagesWithSources! / totalLanguages!) * 100))
    : skeleton;

  return (
    <p className="text-center text-lg text-ink-soft">
      {formatNodes(messages.home.statsWithSources, { total, percent })}
    </p>
  );
}

function SiteHeader() {
  return (
    <header className="bg-navy text-paper">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 shrink-0" aria-hidden />
          <span className="whitespace-nowrap font-heading text-lg font-semibold">
            web-languages
          </span>
        </div>
        <UiLanguageSelect />
      </div>
    </header>
  );
}

export default function Home() {
  const { locale, messages } = useI18n();
  const [languages, setLanguages] = useState<LanguageRecord[]>([]);
  const [languagesFailed, setLanguagesFailed] = useState(false);
  const [selected, setSelected] = useState<LanguageRecord | null>(null);
  const [listed, setListed] = useState<ListState>(EMPTY_LIST);
  const [loadingLists, setLoadingLists] = useState(false);
  const [thanks, setThanks] = useState<{ added: number; skipped: number } | null>(null);
  // The language the lists are currently for. A slow response for a
  // language the visitor has already switched away from is dropped, so it
  // can't overwrite the lists of the one they're looking at.
  const activeLanguageId = useRef<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [languagesWithSources, setLanguagesWithSources] = useState<number | null>(null);

  useEffect(() => {
    loadLanguages()
      .then(setLanguages)
      .catch(() => setLanguagesFailed(true));
  }, []);

  useEffect(() => {
    // A missing stats file just hides the percentage, never shows a dash.
    fetch("/stats.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { languagesWithSources?: number } | null) =>
        setLanguagesWithSources(data?.languagesWithSources ?? null),
      )
      .catch(() => setLanguagesWithSources(null))
      .finally(() => setStatsLoading(false));
  }, []);

  async function loadList(languageId: string) {
    activeLanguageId.current = languageId;
    setLoadingLists(true);
    const result = await fetchList(languageId, 0, FIRST_PAGE - 1);
    if (activeLanguageId.current !== languageId) return;
    setListed(result);
    setLoadingLists(false);
  }

  // Appends the next page, using the current length as the offset.
  async function loadMore(languageId: string, current: ListState) {
    const next = await fetchList(
      languageId,
      current.items.length,
      current.items.length + MORE_PAGE - 1,
    );
    if (activeLanguageId.current !== languageId) return;
    // Keep what's already shown if the next page failed to load.
    if (next.failed) return;
    setListed({ items: [...current.items, ...next.items], total: next.total });
  }

  function handleSelectLanguage(language: LanguageRecord) {
    setSelected(language);
    setThanks(null);
    loadList(language.id);
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-5 py-10">
        {!selected ? (
          <>
            <div className="mx-auto flex max-w-xl flex-col items-center gap-2 text-center">
              <h1 className="font-heading text-4xl font-semibold">{messages.home.title}</h1>
              <p className="text-ink-soft">{messages.home.subtitle}</p>
            </div>

            {languagesFailed && (
              <p role="alert" className="mx-auto max-w-xl text-center font-semibold text-pending">
                {messages.picker.loadFailed}
              </p>
            )}

            <LanguagePicker
              languages={languages}
              loading={languages.length === 0}
              selected={null}
              onSelect={handleSelectLanguage}
              onClear={() => setSelected(null)}
            />

            <StatStrip
              totalLanguages={languages.length || null}
              languagesWithSources={languagesWithSources}
              statsLoading={statsLoading}
            />
          </>
        ) : (
          <>
            <LanguagePicker
              languages={languages}
              selected={selected}
              onSelect={handleSelectLanguage}
              onClear={() => setSelected(null)}
            />

            <div key={selected.id} className="flex flex-col gap-8">
              {thanks !== null ? (
                <section className="border-y border-verified py-8 text-center">
                  <Check className="mx-auto mb-3 h-10 w-10 text-verified" aria-hidden />
                  <h2 className="font-heading text-2xl font-semibold">{messages.thanks.title}</h2>
                  <p className="mt-1 text-ink-soft">
                    {thanks.added > 0
                      ? plural(locale, messages.thanks.shared, thanks.added, {
                          language: selected.refName,
                        })
                      : messages.thanks.allDuplicates}
                    {thanks.added > 0 &&
                      thanks.skipped > 0 &&
                      ` ${plural(locale, messages.thanks.alreadyHad, thanks.skipped)}`}
                  </p>
                  <Button type="button" onClick={() => setThanks(null)} className="mt-4">
                    {messages.thanks.addMore}
                  </Button>
                </section>
              ) : (
                <section className="flex flex-col gap-4">
                  <h2 className="font-heading text-xl font-semibold">{messages.form.heading}</h2>
                  <SubmissionForm
                    languageId={selected.id}
                    onSubmitted={setThanks}
                  />
                </section>
              )}

              {loadingLists ? (
                <p className="text-ink-soft">{messages.lists.loading}</p>
              ) : (
                <UrlList
                  heading={messages.lists.listed}
                  items={listed.items}
                  total={listed.total}
                  failed={listed.failed}
                  onMore={() => loadMore(selected.id, listed)}
                />
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
