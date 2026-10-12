import type { Messages } from "./en";

const ja: Messages = {
  meta: {
    title: "web-languages — あなたの言語のウェブサイトを共有",
    description:
      "あなたの言語のウェブサイトを共有して、Common Crawl の web-languages プロジェクトに協力しましょう。GitHub アカウントは不要です。",
  },
  header: {
    siteLanguage: "表示言語",
  },
  home: {
    title: "あなたの言語のウェブサイトを共有しよう",
    subtitle: "人が話すすべての言語がウェブに反映されるように力を貸してください。あなたの言語を探して、信頼できるサイトを追加しましょう。",
    statsTotal: "人が話す言語を {total} 件記録しています。",
    statsWithSources: "人が話す言語を {total} 件記録しており、そのうちウェブ上の情報源があるのはわずか {percent}% です。",
  },
  picker: {
    loading: "言語を読み込み中…",
    placeholder: "言語を検索…",
    searchLabel: "言語を検索",
    noMatches: "見つかりません。英語名か3文字の言語コードで試してください。",
    back: "別の言語を選ぶ",
    loadFailed: "言語リストを読み込めませんでした。接続を確認して、ページを再読み込みしてください。",
  },
  form: {
    heading: "ウェブサイトを追加",
    linkLabel: "ウェブサイトのリンク",
    noteLabel: "メモ（任意）",
    notePlaceholder: "例：地元のニュース",
    remove: "削除",
    removeLabel: "リンク {number} を削除",
    addAnother: "+ リンクをもう1つ追加",
    send: "送信",
    sending: "送信中…",
    errorEmpty: "ウェブサイトのリンクを入力してください。",
    errorInvalid: "このリンクは正しくないようです。印の付いた欄を確認してください。",
    errorRejected: "うまくいきませんでした。リンクを確認して、もう一度お試しください。",
    errorNetwork: "うまくいきませんでした。もう一度お試しください。",
  },
  thanks: {
    title: "ありがとうございます！",
    shared: {
      one: "{language} のリンクを {count} 件共有しました。",
      other: "{language} のリンクを {count} 件共有しました。",
    },
    alreadyHad: { one: "うち {count} 件はすでに登録済みでした。", other: "うち {count} 件はすでに登録済みでした。" },
    allDuplicates: "これらのリンクはすでに登録済みです。",
    addMore: "さらに追加",
  },
  lists: {
    listed: "登録済み",
    recent: "最近の追加",
    none: "まだありません",
    loading: "読み込み中…",
    more: "もっと見る",
    less: "閉じる",
    loadFailed: "このリストを読み込めませんでした。ページを再読み込みしてください。",
  },
};

export default ja;
