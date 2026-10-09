"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MAX_ROWS = 20;

type Row = { key: string; url: string; note: string };

function newRow(): Row {
  return { key: crypto.randomUUID(), url: "", note: "" };
}

/** If the visitor typed a bare domain ("bbc.com/cymrufyw"), assume https —
 * this audience will not reliably type a scheme, and the schema requires
 * one. Leaves anything that already looks like it has a scheme alone. */
function withScheme(url: string): string {
  const trimmed = url.trim();
  if (trimmed.length === 0 || /^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** A random id kept in this browser, so the team can tell which
 * submissions came from the same visitor. Falls back to a throwaway id
 * when storage is blocked. */
function getSessionId(): string {
  try {
    const existing = localStorage.getItem("lingocrawl-session");
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem("lingocrawl-session", created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

export function SubmissionForm({
  languageId,
  onSubmitted,
}: {
  languageId: string;
  onSubmitted: (count: number) => void;
}) {
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [honeypot, setHoneypot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const honeypotId = useId();

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const links = rows
      .filter((row) => row.url.trim().length > 0)
      .map((row) => ({ url: withScheme(row.url), note: row.note.trim() }));

    if (links.length === 0) {
      setError("Please add a website link.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageId,
          links,
          sessionId: getSessionId(),
          honeypot,
        }),
      });

      if (!response.ok) {
        setError("That did not work. Check the link and try again.");
        return;
      }
      setRows([newRow()]);
      onSubmitted(links.length);
    } catch {
      setError("That did not work. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col">
        {rows.map((row, index) => (
          <div key={row.key} className={index > 0 ? "mt-4 border-t border-border pt-4" : ""}>
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-semibold text-ink-soft">
                  Website link
                </label>
                <Input
                  placeholder="https://example.com"
                  value={row.url}
                  onChange={(e) => updateRow(row.key, { url: e.target.value })}
                  onBlur={(e) => updateRow(row.key, { url: withScheme(e.target.value) })}
                  maxLength={2048}
                  inputMode="url"
                  autoComplete="off"
                />
              </div>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="mt-7 text-sm font-semibold text-ink-soft hover:text-navy"
                  aria-label={`Remove link ${index + 1}`}
                >
                  Remove
                </button>
              )}
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-semibold text-ink-soft">
                Note (optional)
              </label>
              <Input
                placeholder="e.g. Local news from Wales"
                value={row.note}
                onChange={(e) => updateRow(row.key, { note: e.target.value })}
                maxLength={280}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={rows.length >= MAX_ROWS}
        onClick={() => setRows((prev) => (prev.length >= MAX_ROWS ? prev : [...prev, newRow()]))}
        className="self-start"
      >
        + Add another link
      </Button>

      {/* Honeypot: invisible to people, tempting to bots. Any fill-in
          means the request is treated as spam server-side. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor={honeypotId}>Leave this field empty</label>
        <input
          id={honeypotId}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 border border-pending bg-paper-raised p-3 font-semibold text-pending"
        >
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? (
          "Sending..."
        ) : (
          <>
            <Check className="h-5 w-5" aria-hidden />
            Send
          </>
        )}
      </Button>
    </form>
  );
}
