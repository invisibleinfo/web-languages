import type { Messages } from "./en";

const zh: Messages = {
  meta: {
    title: "web-languages — 分享你的语言的网站",
    description: "分享一个使用你的语言的网站，帮助 Common Crawl 的 web-languages 项目——无需 GitHub 账号。",
  },
  header: {
    siteLanguage: "网站语言",
  },
  home: {
    title: "分享一个用你的语言写的网站",
    subtitle: "帮助互联网展现人类使用的每一种语言。找到你的语言，添加一个你信任的网站。",
    statsTotal: "我们记录了人类使用的 {total} 种语言。",
    statsWithSources: "我们记录了人类使用的 {total} 种语言，其中只有 {percent}% 拥有网络来源。",
  },
  picker: {
    loading: "正在加载语言……",
    placeholder: "搜索你的语言……",
    searchLabel: "搜索你的语言",
    noMatches: "没有找到——试试英文名称或三个字母的语言代码。",
    back: "选择其他语言",
    loadFailed: "无法加载语言列表。请检查网络后刷新页面。",
  },
  form: {
    heading: "添加网站",
    linkLabel: "网站链接",
    noteLabel: "备注（可选）",
    notePlaceholder: "例如：本地新闻",
    remove: "删除",
    removeLabel: "删除第 {number} 个链接",
    addAnother: "+ 再添加一个链接",
    send: "发送",
    sending: "正在发送……",
    errorEmpty: "请添加一个网站链接。",
    errorInvalid: "这个链接看起来不对。请检查标出的输入框。",
    errorRejected: "没有成功。请检查链接后重试。",
    errorNetwork: "没有成功。请重试。",
  },
  thanks: {
    title: "谢谢！",
    shared: { one: "你为 {language} 分享了 {count} 个链接。", other: "你为 {language} 分享了 {count} 个链接。" },
    alreadyHad: { one: "其中 {count} 个我们已经有了。", other: "其中 {count} 个我们已经有了。" },
    allDuplicates: "这些链接我们已经有了。",
    addMore: "继续添加",
  },
  lists: {
    listed: "已收录",
    none: "暂无",
    loading: "正在加载……",
    more: "查看更多",
    less: "收起",
    loadFailed: "无法加载此列表。请刷新页面重试。",
  },
};

export default zh;
