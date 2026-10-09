import type { Messages } from "./en";

// Sentences with a number are phrased as "Label: {count}" so the noun
// never has to agree with the count (Russian has three plural forms).
const ru: Messages = {
  meta: {
    title: "LingoCrawl — Поделитесь сайтом на вашем языке",
    description:
      "Помогите проекту web-languages от Common Crawl: поделитесь сайтом на вашем языке. Аккаунт GitHub не нужен.",
  },
  header: {
    siteLanguage: "Язык сайта",
  },
  home: {
    title: "Поделитесь сайтом на вашем языке",
    subtitle: "Помогите составить карту интернета для каждого языка — найдите свой и добавьте сайт, которому доверяете.",
    statsTotal: "Языков в нашем списке: {total}.",
    statsWithSources: "Языков в нашем списке: {total}, из них с источниками: {count}.",
  },
  picker: {
    loading: "Загрузка языков...",
    placeholder: "Найдите свой язык...",
    searchLabel: "Поиск языка",
    noMatches: "Ничего не найдено — попробуйте английское название или трёхбуквенный код.",
    back: "Выбрать другой язык",
    loadFailed: "Не удалось загрузить список языков. Проверьте подключение и обновите страницу.",
  },
  form: {
    heading: "Добавить сайт",
    linkLabel: "Ссылка на сайт",
    noteLabel: "Заметка (необязательно)",
    notePlaceholder: "напр. Местные новости",
    remove: "Убрать",
    removeLabel: "Убрать ссылку {number}",
    addAnother: "+ Добавить ещё ссылку",
    send: "Отправить",
    sending: "Отправка...",
    errorEmpty: "Добавьте ссылку на сайт.",
    errorInvalid: "Ссылка выглядит неправильно. Проверьте отмеченное поле.",
    errorRejected: "Не получилось. Проверьте ссылку и попробуйте снова.",
    errorNetwork: "Не получилось. Попробуйте снова.",
  },
  thanks: {
    title: "Спасибо!",
    shared: {
      one: "Язык: {language}. Отправлено ссылок: {count}.",
      other: "Язык: {language}. Отправлено ссылок: {count}.",
    },
    alreadyHad: { one: "Уже были в нашем списке: {count}.", other: "Уже были в нашем списке: {count}." },
    allDuplicates: "Эти ссылки уже есть в нашем списке.",
    addMore: "Добавить ещё",
  },
  lists: {
    listed: "Уже в списке",
    recent: "Недавно добавлены",
    none: "Пока нет",
    loading: "Загрузка...",
    more: "Показать ещё",
    less: "Свернуть",
    loadFailed: "Не удалось загрузить этот список. Обновите страницу, чтобы попробовать снова.",
  },
};

export default ru;
