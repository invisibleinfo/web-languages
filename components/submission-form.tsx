"use client";

import { Check, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "@/lib/i18n/format";
import { isWebAddress, withScheme } from "@/lib/url";

const MAX_ROWS = 20;

type FormError = "errorEmpty" | "errorInvalid" | "errorRejected" | "errorNetwork";

type Row = { key: string; url: string; note: string };

function newRow(): Row {
  return { key: crypto.randomUUID(), url: "", note: "" };
}

/** A random id kept in this browser, so the team can tell which
 * submissions came from the same visitor. Falls back to a throwaway id
 * when storage is blocked. */
function getSessionId(): string {
  try {
    const existing = localStorage.getItem("web-languages-session");
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem("web-languages-session", created);
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
  onSubmitted: (result: { added: number; skipped: number }) => void;
}) {
  const { locale, messages } = useI18n();
  const [rows, setRows] = useState<Row[]>([newRow()]);
  const [honeypot, setHoneypot] = useState("");
  // Stored as a key, not text, so the message follows a language switch.
  const [error, setError] = useState<FormError | null>(null);
  const [invalidKeys, setInvalidKeys] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const honeypotId = useId();
  const fieldId = useId();

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.key !== key)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const filled = rows.filter((row) => row.url.trim().length > 0);
    if (filled.length === 0) {
      setError("errorEmpty");
      return;
    }

    const invalid = filled.filter((row) => !isWebAddress(withScheme(row.url)));
    setInvalidKeys(new Set(invalid.map((row) => row.key)));
    if (invalid.length > 0) {
      setError("errorInvalid");
      return;
    }

    const links = filled.map((row) => ({ url: withScheme(row.url), note: row.note.trim() }));

    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageId,
          links,
          sessionId: getSessionId(),
          uiLocale: locale,
          honeypot,
        }),
      });

      if (!response.ok) {
        setError("errorRejected");
        return;
      }
      const result = (await response.json()) as { count: number; duplicates: number };
      setRows([newRow()]);
      onSubmitted({ added: result.count, skipped: result.duplicates });
    } catch {
      setError("errorNetwork");
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
                <label
                  htmlFor={`${fieldId}-${row.key}-url`}
                  className="mb-1 block text-sm font-semibold text-ink-soft"
                >
                  {messages.form.linkLabel}
                </label>
                <Input
                  id={`${fieldId}-${row.key}-url`}
                  aria-invalid={invalidKeys.has(row.key) || undefined}
                  className={invalidKeys.has(row.key) ? "border-pending" : undefined}
                  placeholder="https://example.com"
                  value={row.url}
                  onChange={(e) => {
                    updateRow(row.key, { url: e.target.value });
                    if (invalidKeys.has(row.key)) {
                      setInvalidKeys((prev) => new Set([...prev].filter((key) => key !== row.key)));
                    }
                  }}
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
                  aria-label={format(messages.form.removeLabel, { number: index + 1 })}
                >
                  {messages.form.remove}
                </button>
              )}
            </div>
            <div className="mt-3">
              <label
                htmlFor={`${fieldId}-${row.key}-note`}
                className="mb-1 block text-sm font-semibold text-ink-soft"
              >
                {messages.form.noteLabel}
              </label>
              <Input
                id={`${fieldId}-${row.key}-note`}
                placeholder={messages.form.notePlaceholder}
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
        {messages.form.addAnother}
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
          {messages.form[error]}
        </p>
      )}

      <Button type="submit" size="lg" disabled={submitting} className="w-full">
        {submitting ? (
          messages.form.sending
        ) : (
          <>
            <Check className="h-5 w-5" aria-hidden />
            {messages.form.send}
          </>
        )}
      </Button>
    </form>
  );
}
