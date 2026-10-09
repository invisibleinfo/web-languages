"use client";

import { Check, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { LanguagePicker } from "@/components/language-picker";
import { Button } from "@/components/ui/button";
import { SubmissionForm } from "@/components/submission-form";
import { UrlList, type UrlListItem } from "@/components/url-list";
import { loadLanguages, type LanguageRecord } from "@/lib/languages";
import { supabase } from "@/lib/supabase/client";

const FIRST_PAGE = 3;
const MORE_PAGE = 20;

type ListState = { items: UrlListItem[]; total: number };
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
  const { data, count } = await supabase
    .from(source.table)
    .select("url, note", { count: "exact" })
    .eq("language_id", languageId)
    .order(source.orderBy, { ascending: source.ascending })
    .range(from, to);
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
  const showSecond = statsLoading || languagesWithSources !== null;
  return (
    <p className="text-center text-lg text-ink-soft">
      We&apos;re already tracking{" "}
      <span className="font-mono tabular-data font-semibold text-ink">
        {totalLanguages === null ? "···" : totalLanguages.toLocaleString("en-US")}
      </span>{" "}
      languages
      {showSecond && (
        <>
          {" — "}
          {statsLoading ? (
            <span className="inline-block h-4 w-10 animate-pulse bg-border align-middle" aria-hidden />
          ) : (
            <span className="font-mono tabular-data font-semibold text-ink">
              {languagesWithSources!.toLocaleString("en-US")}
            </span>
          )}{" "}
          of them already have a source
        </>
      )}
      .
    </p>
  );
}

function SiteHeader() {
  return (
    <header className="bg-navy text-paper">
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-3">
        <Languages className="h-5 w-5" aria-hidden />
        <span className="font-heading text-lg font-semibold">LingoCrawl</span>
      </div>
    </header>
  );
}

export default function Home() {
  const [languages, setLanguages] = useState<LanguageRecord[]>([]);
  const [selected, setSelected] = useState<LanguageRecord | null>(null);
  const [listed, setListed] = useState<ListState>(EMPTY_LIST);
  const [recent, setRecent] = useState<ListState>(EMPTY_LIST);
  const [loadingLists, setLoadingLists] = useState(false);
  const [thanks, setThanks] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [languagesWithSources, setLanguagesWithSources] = useState<number | null>(null);

  useEffect(() => {
    loadLanguages().then(setLanguages);
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
    setLoadingLists(true);
    const [listedResult, recentResult] = await Promise.all([
      fetchList(LISTED, languageId, 0, FIRST_PAGE - 1),
      fetchList(RECENT, languageId, 0, FIRST_PAGE - 1),
    ]);
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
              <h1 className="font-heading text-4xl font-semibold">
                Share a website in your language
              </h1>
              <p className="text-ink-soft">
                Help build a map of the web for every language — find yours and add a site you
                trust.
              </p>
            </div>

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
                  <h2 className="font-heading text-2xl font-semibold">Thank you!</h2>
                  <p className="mt-1 text-ink-soft">
                    You shared {thanks} {thanks === 1 ? "link" : "links"} for {selected.refName}.
                  </p>
                  <Button type="button" onClick={() => setThanks(null)} className="mt-4">
                    Add more
                  </Button>
                </section>
              ) : (
                <section className="flex flex-col gap-4">
                  <h2 className="font-heading text-xl font-semibold">Add a website</h2>
                  <SubmissionForm
                    languageId={selected.id}
                    onSubmitted={(count) => {
                      setThanks(count);
                      loadLists(selected.id);
                    }}
                  />
                </section>
              )}

              {loadingLists ? (
                <p className="text-ink-soft">Loading...</p>
              ) : (
                <>
                  <UrlList
                    heading="Already listed"
                    items={listed.items}
                    total={listed.total}
                    onMore={() => loadMore(LISTED, selected.id, listed, setListed)}
                  />
                  <UrlList
                    heading="Recently added"
                    items={recent.items}
                    total={recent.total}
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
