"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";

const COLLAPSED_COUNT = 3;

export type UrlListItem = {
  url: string;
  note: string | null;
};

/** Shared list shape for both "already listed" (repo_links) and "recently
 * added" (public_submissions): three items, then "See more" (which asks the
 * parent for the next page) and "See less" to fold back to three. */
export function UrlList({
  heading,
  items,
  total,
  failed = false,
  onMore,
}: {
  heading: string;
  items: UrlListItem[];
  total: number;
  failed?: boolean;
  onMore: () => Promise<void>;
}) {
  const { locale, messages } = useI18n();
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hasUnloaded = items.length < total;
  const showMore = expanded ? hasUnloaded : items.length > COLLAPSED_COUNT || hasUnloaded;
  const showLess = expanded && items.length > COLLAPSED_COUNT;

  async function handleMore() {
    setExpanded(true);
    // Items already loaded just reappear; only hit the network when there
    // is nothing beyond what's on screen.
    if (items.length > visible.length || !hasUnloaded) return;
    setLoadingMore(true);
    await onMore();
    setLoadingMore(false);
  }

  return (
    <section>
      <h3 className="mb-2 font-heading text-lg font-semibold">
        {heading}
        {total > 0 && (
          <span className="ml-2 text-base font-sans font-normal italic text-ink-soft">
            {total.toLocaleString(locale)}
          </span>
        )}
      </h3>
      {failed ? (
        <p role="alert" className="font-semibold text-pending">
          {messages.lists.loadFailed}
        </p>
      ) : items.length === 0 ? (
        <p className="text-ink-soft">{messages.lists.none}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {visible.map((item, index) => (
              <li key={`${item.url}-${index}`} className="text-lg leading-snug">
                <a
                  href={item.url}
                  target="_blank"
                  rel="nofollow ugc noopener noreferrer"
                  className="break-words text-navy underline decoration-border underline-offset-2 hover:decoration-navy"
                >
                  {item.url}
                </a>
                {item.note && <span className="text-ink-soft"> — {item.note}</span>}
              </li>
            ))}
          </ul>
          {(showMore || showLess) && (
            <div className="mt-2 flex gap-4">
              {showMore && (
                <button
                  type="button"
                  onClick={handleMore}
                  disabled={loadingMore}
                  className="text-sm font-semibold text-navy underline underline-offset-2 disabled:opacity-60"
                >
                  {loadingMore ? messages.lists.loading : messages.lists.more}
                </button>
              )}
              {showLess && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="text-sm font-semibold text-navy underline underline-offset-2"
                >
                  {messages.lists.less}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
