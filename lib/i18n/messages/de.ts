import type { Messages } from "./en";

const de: Messages = {
  meta: {
    title: "web-languages — Teile eine Website in deiner Sprache",
    description:
      "Hilf dem web-languages-Projekt von Common Crawl, indem du eine Website in deiner Sprache teilst — ganz ohne GitHub-Konto.",
  },
  header: {
    siteLanguage: "Sprache der Website",
  },
  home: {
    title: "Teile eine Website in deiner Sprache",
    subtitle:
      "Hilf mit, dass das Web jede von Menschen gesprochene Sprache widerspiegelt. Finde deine Sprache und füge eine Website hinzu, der du vertraust.",
    statsTotal: "Wir erfassen {total} von Menschen gesprochene Sprachen.",
    statsWithSources: "Wir erfassen {total} von Menschen gesprochene Sprachen, aber nur {percent}% davon haben eine Quelle im Web.",
  },
  picker: {
    loading: "Sprachen werden geladen...",
    placeholder: "Suche deine Sprache...",
    searchLabel: "Nach deiner Sprache suchen",
    noMatches: "Keine Treffer — versuche den englischen Namen oder den 3-Buchstaben-Code.",
    back: "Andere Sprache wählen",
    loadFailed: "Die Sprachliste konnte nicht geladen werden. Prüfe deine Verbindung und lade die Seite neu.",
  },
  form: {
    heading: "Website hinzufügen",
    linkLabel: "Link zur Website",
    noteLabel: "Notiz (optional)",
    notePlaceholder: "z. B. Lokale Nachrichten",
    remove: "Entfernen",
    removeLabel: "Link {number} entfernen",
    addAnother: "+ Weiteren Link hinzufügen",
    send: "Senden",
    sending: "Wird gesendet...",
    errorEmpty: "Bitte füge einen Website-Link hinzu.",
    errorInvalid: "Dieser Link sieht nicht richtig aus. Prüfe das markierte Feld.",
    errorRejected: "Das hat nicht geklappt. Prüfe den Link und versuche es noch einmal.",
    errorNetwork: "Das hat nicht geklappt. Versuche es noch einmal.",
  },
  thanks: {
    title: "Danke!",
    shared: {
      one: "Du hast {count} Link für {language} geteilt.",
      other: "Du hast {count} Links für {language} geteilt.",
    },
    alreadyHad: { one: "{count} war schon auf unserer Liste.", other: "{count} waren schon auf unserer Liste." },
    allDuplicates: "Diese Links haben wir schon.",
    addMore: "Mehr hinzufügen",
  },
  lists: {
    listed: "Bereits gelistet",
    none: "Noch keine",
    loading: "Wird geladen...",
    more: "Mehr anzeigen",
    less: "Weniger anzeigen",
    loadFailed: "Diese Liste konnte nicht geladen werden. Lade die Seite neu, um es noch einmal zu versuchen.",
  },
};

export default de;
