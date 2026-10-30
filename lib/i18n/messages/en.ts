import type { PluralText } from "../format";

// The source of truth for site text. Every other language file is typed
// against this shape, so a missing or extra key fails the typecheck.
// Placeholders like {count} are filled in by lib/i18n/format.ts.
const en = {
  meta: {
    title: "web-languages — Share a website for your language",
    description:
      "Help Common Crawl's web-languages project by sharing a website in your language — no GitHub account needed.",
  },
  header: {
    siteLanguage: "Website language",
  },
  home: {
    title: "Share a website in your language",
    subtitle: "Help the web reflect every language humans speak. Find yours and add a site you trust.",
    statsTotal: "We track {total} languages spoken by humans.",
    statsWithSources: "We track {total} languages spoken by humans, only {percent}% of them have a web source.",
  },
  picker: {
    loading: "Loading languages...",
    placeholder: "Search your language...",
    searchLabel: "Search for your language",
    noMatches: "No matches — try another spelling, or the 3-letter language code.",
    back: "Choose a different language",
    loadFailed: "Could not load the language list. Check your connection and reload the page.",
  },
  form: {
    heading: "Add a website",
    linkLabel: "Website link",
    noteLabel: "Note (optional)",
    notePlaceholder: "e.g. Local news from Wales",
    remove: "Remove",
    removeLabel: "Remove link {number}",
    addAnother: "+ Add another link",
    send: "Send",
    sending: "Sending...",
    errorEmpty: "Please add a website link.",
    errorInvalid: "This link does not look right. Check the marked box.",
    errorRejected: "That did not work. Check the link and try again.",
    errorNetwork: "That did not work. Try again.",
  },
  thanks: {
    title: "Thank you!",
    shared: { one: "You shared {count} link for {language}.", other: "You shared {count} links for {language}." } as PluralText,
    alreadyHad: { one: "{count} was already on our list.", other: "{count} were already on our list." } as PluralText,
    allDuplicates: "We already have these links.",
    addMore: "Add more",
  },
  lists: {
    listed: "Already listed",
    none: "None yet",
    loading: "Loading...",
    more: "See more",
    less: "See less",
    loadFailed: "Could not load this list. Reload the page to try again.",
  },
};

export type Messages = typeof en;
export default en;
