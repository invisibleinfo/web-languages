import { LOCALE_CODES, type Locale } from "./i18n/locales";
import { languageIdSchema, urlRowSchema } from "./validation";

export type SubmittedLink = { url: string; note: string };

/** A link as read back from an issue: its number, and whether the maintainer
 * ticked it. */
export type ReviewedLink = SubmittedLink & { number: number; checked: boolean };

export type IssueDraft = { title: string; labels: string[]; body: string };

export type ParsedIssue = {
  languageId: string;
  uiLocale: Locale;
  links: ReviewedLink[];
  /** Lines in the link list that aren't a valid address. */
  invalid: string[];
};

export const SUBMISSION_LABEL = "submission";
export const VALIDATED_LABEL = "validated";

/** Inline code, so GitHub never turns a note into a mention or a live link.
 * Padded when the text touches a backtick, as Markdown requires. */
function codeSpan(text: string): string {
  const longestRun = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const mark = "`".repeat(longestRun + 1);
  return /^`|`$/.test(text) ? `${mark} ${text} ${mark}` : `${mark}${text}${mark}`;
}

/** The issue a maintainer reviews. Each link is a task-list tick box. An
 * address is a plain autolink so it can be clicked; one that can't be an
 * autolink falls back to inline code. */
export function buildIssue(
  languageId: string,
  uiLocale: Locale,
  links: SubmittedLink[],
): IssueDraft {
  const lines = links.map(({ url, note }, i) => {
    const address = /^[^\s<>`]+$/.test(url) ? `<${url}>` : codeSpan(url);
    const oneLine = note.replace(/\s+/g, " ").trim();
    return `- [ ] **${i + 1}.** ${address}${oneLine ? ` | ${codeSpan(oneLine)}` : ""}`;
  });

  return {
    title: `[${languageId}] ${links.length} ${links.length === 1 ? "link" : "links"}`,
    // No per-language label: there are ~7,900 languages, and the title
    // already carries the code.
    labels: [SUBMISSION_LABEL, `ui:${uiLocale}`],
    body: [
      `Language: ${languageId}`,
      `UI language: ${uiLocale}`,
      "",
      "Tick the links to accept. Links left unticked are considered as rejected.",
      "To explain a decision, add a comment before adding the label. Comments are only for people to read.",
      "",
      ...lines,
      "",
      `When you are done, add the \`${VALIDATED_LABEL}\` label.`,
    ].join("\n"),
  };
}

/** Reads one `<address>`, `` `code` `` or bare word off the front of `text`. */
function readSpan(text: string): { value: string; rest: string } | null {
  if (text.startsWith("<")) {
    const end = text.indexOf(">");
    return end === -1 ? null : { value: text.slice(1, end), rest: text.slice(end + 1) };
  }
  if (text.startsWith("`")) {
    const open = /^`+/.exec(text)![0];
    for (const run of text.matchAll(/`+/g)) {
      if (run.index === 0 || run[0].length !== open.length) continue;
      let value = text.slice(open.length, run.index);
      if (/^ [\s\S]* $/.test(value) && value.trim() !== "") value = value.slice(1, -1);
      return { value, rest: text.slice(run.index + open.length) };
    }
    return null;
  }
  const word = /^\S+/.exec(text);
  return word ? { value: word[0], rest: text.slice(word[0].length) } : null;
}

const TASK_LINE = /^\s*[-*+]\s+\[([ xX])\]\s+(?:\*\*(\d+)\.\*\*\s+)?(.*)$/;

/** The url and note on one link line: `<url> | \`note\``. Anything else on
 * the line is ignored. */
function splitLink(line: string): { url: string; note: string } {
  const address = readSpan(line.trim());
  if (!address) return { url: line.trim(), note: "" };
  const after = address.rest.trim();
  if (!after.startsWith("|")) return { url: address.value, note: "" };
  const noteText = after.slice(1).trim();
  const note = noteText.startsWith("`") ? (readSpan(noteText)?.value ?? noteText) : noteText;
  return { url: address.value, note };
}

/** A line from the old code-fence list: `url | note`, the note as plain text. */
function splitLegacyLink(line: string): { url: string; note: string } {
  const split = line.indexOf(" | ");
  return split === -1 ? { url: line, note: "" } : { url: line.slice(0, split), note: line.slice(split + 3) };
}

/** Reads an issue body back, as it is *now* (including ticks and hand edits).
 * Returns null when it isn't one of ours. */
export function parseIssueBody(body: string): ParsedIssue | null {
  const language = languageIdSchema.safeParse(/^Language:[ \t]*(\S+)[ \t]*$/m.exec(body)?.[1]);
  const locale = /^UI language:[ \t]*(\S+)[ \t]*$/m.exec(body)?.[1];
  if (!language.success || !locale || !(LOCALE_CODES as string[]).includes(locale)) return null;

  const lines = body.split(/\r?\n/);
  const entries = readEntries(lines);
  if (!entries) return null;

  const links: ReviewedLink[] = [];
  const invalid: string[] = [];
  for (const { text, checked, number, legacy } of entries) {
    const { url, note } = legacy ? splitLegacyLink(text) : splitLink(text);
    const parsed = urlRowSchema.safeParse({ url, note });
    if (parsed.success) links.push({ ...parsed.data, number, checked });
    else invalid.push(text.trim());
  }

  return { languageId: language.data, uiLocale: locale as Locale, links, invalid };
}

type Entry = { text: string; checked: boolean; number: number; legacy: boolean };

/** The tick-box lines, or for issues opened before tick boxes existed, the
 * lines in the code fence (all counted as ticked). */
function readEntries(lines: string[]): Entry[] | null {
  const ticks = lines.flatMap((line) => {
    const match = TASK_LINE.exec(line);
    return match ? [{ box: match[1], number: match[2], text: match[3] }] : [];
  });
  if (ticks.length > 0) {
    return ticks.map(({ box, number, text }, i) => ({
      text,
      checked: box !== " ",
      number: number ? Number(number) : i + 1,
      legacy: false,
    }));
  }

  const open = lines.findIndex((line) => /^`{3,}$/.test(line.trim()));
  if (open === -1) return null;
  const fence = lines[open].trim();
  const close = lines.findIndex((line, i) => i > open && line.trim() === fence);
  if (close === -1) return null;
  return lines
    .slice(open + 1, close)
    .filter((line) => line.trim())
    .map((text, i) => ({ text, checked: true, number: i + 1, legacy: true }));
}
