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
import { supabase } from "@/lib/supabase/client";

const FIRST_PAGE = 3;
const MORE_PAGE = 20;

type ListState = { items: UrlListItem[]; total: number; failed?: boolean };
const EMPTY_LIST: ListState = { items: [], total: 0 };

type ListSource = {
  table: "repo_links" | "public_submissions";
  orderBy: string;
  ascending: boolean;
};
const LISTED: ListSource = { table: "repo_links", orderBy: "url", ascending: true };
const RECENT: ListSource = { table: "public_submissions", orderBy: "submitted_at", ascending: false };

async function fetchList(
  source: ListSource,
  languageId: string,
  from: number,
  to: number,
): Promise<ListState> {
  const { data, count, error } = await supabase
    .from(source.table)
    .select("url, note", { count: "exact" })
    .eq("language_id", languageId)
    .order(source.orderBy, { ascending: source.ascending })
    .range(from, to);
  // A failed read must not look like "None yet".
  if (error) return { items: [], total: 0, failed: true };
  return { items: (data as UrlListItem[]) ?? [], total: count ?? 0 };
}

// A stat that isn't resolved yet shows a skeleton; one that resolved to
// "unavailable" (the backing view doesn't exist until a migration runs)
// disappears rather than ever showing a permanent dash.
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

  // Once the source count resolved to "unavailable", show only the total.
  if (!statsLoading && languagesWithSources === null) {
    return (
      <p className="text-center text-lg text-ink-soft">
        {formatNodes(messages.home.statsTotal, { total })}
      </p>
    );
  }
  return (
    <p className="text-center text-lg text-ink-soft">
      {formatNodes(messages.home.statsWithSources, {
        total,
        count: statsLoading ? (
          <span className="inline-block h-4 w-10 animate-pulse bg-border align-middle" aria-hidden />
        ) : (
          number(languagesWithSources!)
        ),
      })}
    </p>
  );
}

function SiteHeader() {
  return (
    <header className="bg-navy text-paper">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Languages className="h-5 w-5" aria-hidden />
          <span className="font-heading text-lg font-semibold">LingoCrawl</span>
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
  const [recent, setRecent] = useState<ListState>(EMPTY_LIST);
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
    supabase
      .from("repo_links_stats")
      .select("languages_with_sources")
      .single()
      .then(({ data }) => {
        setLanguagesWithSources(data?.languages_with_sources ?? null);
        setStatsLoading(false);
      });
  }, []);

  async function loadLists(languageId: string) {
    activeLanguageId.current = languageId;
    setLoadingLists(true);
    const [listedResult, recentResult] = await Promise.all([
      fetchList(LISTED, languageId, 0, FIRST_PAGE - 1),
      fetchList(RECENT, languageId, 0, FIRST_PAGE - 1),
    ]);
    if (activeLanguageId.current !== languageId) return;
    setListed(listedResult);
    setRecent(recentResult);
    setLoadingLists(false);
  }

  // Appends the next page. Uses the current length as the offset, so a
  // list that grew since it loaded can at worst repeat an item.
  async function loadMore(
    source: ListSource,
    languageId: string,
    current: ListState,
    set: (next: ListState) => void,
  ) {
    const next = await fetchList(
      source,
      languageId,
      current.items.length,
      current.items.length + MORE_PAGE - 1,
    );
    if (activeLanguageId.current !== languageId) return;
    // Keep what's already shown if the next page failed to load.
    if (next.failed) return;
    set({ items: [...current.items, ...next.items], total: next.total });
  }

  function handleSelectLanguage(language: LanguageRecord) {
    setSelected(language);
    setThanks(null);
    loadLists(language.id);
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
                    onSubmitted={(result) => {
                      setThanks(result);
                      loadLists(selected.id);
                    }}
                  />
                </section>
              )}

              {loadingLists ? (
                <p className="text-ink-soft">{messages.lists.loading}</p>
              ) : (
                <>
                  <UrlList
                    heading={messages.lists.listed}
                    items={listed.items}
                    total={listed.total}
                    failed={listed.failed}
                    onMore={() => loadMore(LISTED, selected.id, listed, setListed)}
                  />
                  <UrlList
                    heading={messages.lists.recent}
                    items={recent.items}
                    total={recent.total}
                    failed={recent.failed}
                    onMore={() => loadMore(RECENT, selected.id, recent, setRecent)}
                  />
                </>
              )}
            </div>
          </>
        )}
      </main>
    </>
  );
}
