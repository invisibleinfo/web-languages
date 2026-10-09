import type { Messages } from "./en";

const es: Messages = {
  meta: {
    title: "LingoCrawl — Comparte un sitio web en tu idioma",
    description:
      "Ayuda al proyecto web-languages de Common Crawl compartiendo un sitio web en tu idioma, sin necesidad de cuenta de GitHub.",
  },
  header: {
    siteLanguage: "Idioma del sitio",
  },
  home: {
    title: "Comparte un sitio web en tu idioma",
    subtitle: "Ayuda a crear un mapa de la web para cada idioma: busca el tuyo y añade un sitio de confianza.",
    statsTotal: "Ya seguimos {total} idiomas.",
    statsWithSources: "Ya seguimos {total} idiomas y {count} de ellos ya tienen una fuente.",
  },
  picker: {
    loading: "Cargando idiomas...",
    placeholder: "Busca tu idioma...",
    searchLabel: "Buscar tu idioma",
    noMatches: "Sin resultados: prueba con el nombre en inglés o el código de 3 letras.",
    back: "Elegir otro idioma",
    loadFailed: "No se pudo cargar la lista de idiomas. Revisa tu conexión y recarga la página.",
  },
  form: {
    heading: "Añadir un sitio web",
    linkLabel: "Enlace del sitio web",
    noteLabel: "Nota (opcional)",
    notePlaceholder: "p. ej. Noticias locales",
    remove: "Quitar",
    removeLabel: "Quitar el enlace {number}",
    addAnother: "+ Añadir otro enlace",
    send: "Enviar",
    sending: "Enviando...",
    errorEmpty: "Añade un enlace de sitio web.",
    errorInvalid: "Este enlace no parece correcto. Revisa la casilla marcada.",
    errorRejected: "No funcionó. Revisa el enlace e inténtalo de nuevo.",
    errorNetwork: "No funcionó. Inténtalo de nuevo.",
  },
  thanks: {
    title: "¡Gracias!",
    shared: {
      one: "Compartiste {count} enlace para {language}.",
      other: "Compartiste {count} enlaces para {language}.",
    },
    alreadyHad: { one: "{count} ya estaba en nuestra lista.", other: "{count} ya estaban en nuestra lista." },
    allDuplicates: "Ya tenemos estos enlaces.",
    addMore: "Añadir más",
  },
  lists: {
    listed: "Ya en la lista",
    recent: "Añadidos hace poco",
    none: "Todavía ninguno",
    loading: "Cargando...",
    more: "Ver más",
    less: "Ver menos",
    loadFailed: "No se pudo cargar esta lista. Recarga la página para intentarlo de nuevo.",
  },
};

export default es;
