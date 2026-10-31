import { LOCALE_CODES, type Locale } from "./i18n/locales";
import { languageIdSchema, urlRowSchema } from "./validation";

export type SubmittedLink = { url: string; note: string };

export type IssueDraft = { title: string; labels: string[]; body: string };

export type ParsedIssue = {
  languageId: string;
  uiLocale: Locale;
  links: SubmittedLink[];
  /** Lines in the link list that aren't a valid address. */
  invalid: string[];
};

export const SUBMISSION_LABEL = "submission";
export const APPROVED_LABEL = "approved";
export const REJECTED_LABEL = "rejected";

/** The issue a maintainer reviews. The links sit in a code fence so GitHub
 * never turns a note into a mention or a live link, and so a line can be
 * deleted by hand to reject just that link. */
export function buildIssue(
  languageId: string,
  uiLocale: Locale,
  links: SubmittedLink[],
): IssueDraft {
  const lines = links.map(({ url, note }) => {
    const oneLine = note.replace(/\s+/g, " ").trim();
    return oneLine ? `${url} | ${oneLine}` : url;
  });
  // A fence longer than any run of backticks inside, so content can't close it.
  const longestRun = Math.max(0, ...(lines.join("\n").match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longestRun + 1));

  return {
    title: `[${languageId}] ${links.length} ${links.length === 1 ? "link" : "links"}`,
    // No per-language label: there are ~7,900 languages, and the title
    // already carries the code.
    labels: [SUBMISSION_LABEL, `ui:${uiLocale}`],
    body: [
      `Language: ${languageId}`,
      `UI language: ${uiLocale}`,
      "",
      "Links (delete any line you want to reject, then approve):",
      "",
      fence,
      ...lines,
      fence,
      "",
      `Add the \`${APPROVED_LABEL}\` label to accept, or the \`${REJECTED_LABEL}\` label to reject.`,
    ].join("\n"),
  };
}

/** Reads an issue body back, as it is *now* (including hand edits).
 * Returns null when it isn't one of ours. */
export function parseIssueBody(body: string): ParsedIssue | null {
  const language = languageIdSchema.safeParse(/^Language:[ \t]*(\S+)[ \t]*$/m.exec(body)?.[1]);
  const locale = /^UI language:[ \t]*(\S+)[ \t]*$/m.exec(body)?.[1];
  if (!language.success || !locale || !(LOCALE_CODES as string[]).includes(locale)) return null;

  const lines = body.split(/\r?\n/);
  const open = lines.findIndex((line) => /^`{3,}$/.test(line.trim()));
  if (open === -1) return null;
  const fence = lines[open].trim();
  const close = lines.findIndex((line, i) => i > open && line.trim() === fence);
  if (close === -1) return null;

  const links: SubmittedLink[] = [];
  const invalid: string[] = [];
  for (const line of lines.slice(open + 1, close)) {
    if (!line.trim()) continue;
    const split = line.indexOf(" | ");
    const parsed = urlRowSchema.safeParse({
      url: split === -1 ? line : line.slice(0, split),
      note: split === -1 ? "" : line.slice(split + 3),
    });
    if (parsed.success) links.push(parsed.data);
    else invalid.push(line.trim());
  }

  return { languageId: language.data, uiLocale: locale as Locale, links, invalid };
}
