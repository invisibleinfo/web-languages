import type { Messages } from "./en";

const pt: Messages = {
  meta: {
    title: "web-languages — Compartilhe um site no seu idioma",
    description:
      "Ajude o projeto web-languages da Common Crawl compartilhando um site no seu idioma — sem precisar de conta no GitHub.",
  },
  header: {
    siteLanguage: "Idioma do site",
  },
  home: {
    title: "Compartilhe um site no seu idioma",
    subtitle: "Ajude a web a refletir cada idioma falado por pessoas. Encontre o seu e adicione um site em que você confia.",
    statsTotal: "Acompanhamos {total} idiomas falados por pessoas.",
    statsWithSources: "Acompanhamos {total} idiomas falados por pessoas, e apenas {percent}% deles têm uma fonte na web.",
  },
  picker: {
    loading: "Carregando idiomas...",
    placeholder: "Pesquise seu idioma...",
    searchLabel: "Pesquisar seu idioma",
    noMatches: "Nada encontrado — tente o nome em inglês ou o código de 3 letras.",
    back: "Escolher outro idioma",
    loadFailed: "Não foi possível carregar a lista de idiomas. Verifique sua conexão e recarregue a página.",
  },
  form: {
    heading: "Adicionar um site",
    linkLabel: "Link do site",
    noteLabel: "Observação (opcional)",
    notePlaceholder: "ex.: Notícias locais",
    remove: "Remover",
    removeLabel: "Remover link {number}",
    addAnother: "+ Adicionar outro link",
    send: "Enviar",
    sending: "Enviando...",
    errorEmpty: "Adicione um link de site.",
    errorInvalid: "Este link não parece certo. Verifique a caixa marcada.",
    errorRejected: "Não funcionou. Verifique o link e tente de novo.",
    errorNetwork: "Não funcionou. Tente de novo.",
  },
  thanks: {
    title: "Obrigado!",
    shared: {
      one: "Você compartilhou {count} link para {language}.",
      other: "Você compartilhou {count} links para {language}.",
    },
    alreadyHad: { one: "{count} já estava na nossa lista.", other: "{count} já estavam na nossa lista." },
    allDuplicates: "Já temos estes links.",
    addMore: "Adicionar mais",
  },
  lists: {
    listed: "Já na lista",
    recent: "Adicionados recentemente",
    none: "Nenhum ainda",
    loading: "Carregando...",
    more: "Ver mais",
    less: "Ver menos",
    loadFailed: "Não foi possível carregar esta lista. Recarregue a página para tentar de novo.",
  },
};

export default pt;
