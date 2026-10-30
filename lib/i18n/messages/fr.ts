import type { Messages } from "./en";

const fr: Messages = {
  meta: {
    title: "web-languages — Partagez un site web dans votre langue",
    description:
      "Aidez le projet web-languages de Common Crawl en partageant un site web dans votre langue — sans compte GitHub.",
  },
  header: {
    siteLanguage: "Langue du site",
  },
  home: {
    title: "Partagez un site web dans votre langue",
    subtitle: "Aidez le web à refléter chaque langue parlée par des humains. Trouvez la vôtre et ajoutez un site de confiance.",
    statsTotal: "Nous suivons {total} langues parlées par des humains.",
    statsWithSources: "Nous suivons {total} langues parlées par des humains, et seulement {percent} % d'entre elles ont une source sur le web.",
  },
  picker: {
    loading: "Chargement des langues...",
    placeholder: "Cherchez votre langue...",
    searchLabel: "Chercher votre langue",
    noMatches: "Aucun résultat — essayez le nom en anglais ou le code à 3 lettres.",
    back: "Choisir une autre langue",
    loadFailed: "Impossible de charger la liste des langues. Vérifiez votre connexion et rechargez la page.",
  },
  form: {
    heading: "Ajouter un site web",
    linkLabel: "Lien du site",
    noteLabel: "Note (facultatif)",
    notePlaceholder: "ex. : Actualités locales",
    remove: "Retirer",
    removeLabel: "Retirer le lien {number}",
    addAnother: "+ Ajouter un autre lien",
    send: "Envoyer",
    sending: "Envoi...",
    errorEmpty: "Ajoutez un lien de site web.",
    errorInvalid: "Ce lien ne semble pas correct. Vérifiez la case signalée.",
    errorRejected: "Cela n'a pas marché. Vérifiez le lien et réessayez.",
    errorNetwork: "Cela n'a pas marché. Réessayez.",
  },
  thanks: {
    title: "Merci !",
    shared: {
      one: "Vous avez partagé {count} lien pour {language}.",
      other: "Vous avez partagé {count} liens pour {language}.",
    },
    alreadyHad: { one: "{count} était déjà dans notre liste.", other: "{count} étaient déjà dans notre liste." },
    allDuplicates: "Nous avons déjà ces liens.",
    addMore: "Ajouter d'autres liens",
  },
  lists: {
    listed: "Déjà répertoriés",
    none: "Aucun pour l'instant",
    loading: "Chargement...",
    more: "Voir plus",
    less: "Voir moins",
    loadFailed: "Impossible de charger cette liste. Rechargez la page pour réessayer.",
  },
};

export default fr;
