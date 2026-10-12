"use client";

import { Globe } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LOCALES } from "@/lib/i18n/locales";

/** Header control for the interface language: a compact globe-icon-and-
 * code button ("🌐 EN") that opens a visible menu of every language by its
 * own full name. Built from plain, always-real DOM elements — nothing
 * hidden or faked. An earlier version tried the same compact look by
 * hiding a native <select> under a fake button; that rendered fine in
 * testing but broke on real phones, because mobile browsers don't all
 * treat an invisible form control the same way. This has no invisible
 * element to desync: the menu is either actually there or actually not. */
export function UiLanguageSelect() {
  const { locale, messages, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function choose(code: (typeof LOCALES)[number]["code"]) {
    setOpen(false);
    buttonRef.current?.focus();
    if (code !== locale) setLocale(code);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={messages.header.siteLanguage}
        className="flex min-h-11 items-center gap-2 rounded-sm px-2 py-2 text-paper/85 outline-none transition-colors hover:text-paper focus-visible:text-paper focus-visible:ring-2 focus-visible:ring-paper focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
      >
        <Globe className="h-4 w-4 shrink-0" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wide">{locale}</span>
        <span className="text-[10px]" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={menuId}
          role="listbox"
          aria-label={messages.header.siteLanguage}
          // z-30: paints above page content it overlaps (e.g. the search
          // box), same idea as before. No max-height here — capping it
          // shorter than its 10 rows is what clipped the last couple of
          // languages off invisibly last time; it isn't tall enough to
          // need a scroll cap on any real phone anyway.
          className="absolute right-0 z-30 mt-1 w-44 border border-border bg-paper-raised py-1 shadow-md"
        >
          {LOCALES.map((option) => (
            <li key={option.code}>
              <button
                type="button"
                role="option"
                aria-selected={option.code === locale}
                lang={option.code}
                onClick={() => choose(option.code)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-paper ${
                  option.code === locale ? "font-semibold text-navy" : "text-ink"
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
