import type { Messages } from "./en";

const hi: Messages = {
  meta: {
    title: "LingoCrawl — अपनी भाषा की वेबसाइट साझा करें",
    description:
      "अपनी भाषा की कोई वेबसाइट साझा करके Common Crawl के web-languages प्रोजेक्ट की मदद करें — GitHub खाते की ज़रूरत नहीं।",
  },
  header: {
    siteLanguage: "वेबसाइट की भाषा",
  },
  home: {
    title: "अपनी भाषा की वेबसाइट साझा करें",
    subtitle: "हर भाषा के लिए वेब का नक्शा बनाने में मदद करें — अपनी भाषा खोजें और भरोसेमंद वेबसाइट जोड़ें।",
    statsTotal: "हम पहले से {total} भाषाओं पर नज़र रख रहे हैं।",
    statsWithSources: "हम पहले से {total} भाषाओं पर नज़र रख रहे हैं — इनमें से {count} भाषाओं के लिए स्रोत मौजूद हैं।",
  },
  picker: {
    loading: "भाषाएँ लोड हो रही हैं...",
    placeholder: "अपनी भाषा खोजें...",
    searchLabel: "अपनी भाषा खोजें",
    noMatches: "कुछ नहीं मिला — अंग्रेज़ी नाम या 3 अक्षरों वाला कोड आज़माएँ।",
    back: "दूसरी भाषा चुनें",
    loadFailed: "भाषाओं की सूची लोड नहीं हो पाई। अपना कनेक्शन जाँचें और पेज फिर से लोड करें।",
  },
  form: {
    heading: "वेबसाइट जोड़ें",
    linkLabel: "वेबसाइट का लिंक",
    noteLabel: "टिप्पणी (वैकल्पिक)",
    notePlaceholder: "जैसे: स्थानीय समाचार",
    remove: "हटाएँ",
    removeLabel: "लिंक {number} हटाएँ",
    addAnother: "+ एक और लिंक जोड़ें",
    send: "भेजें",
    sending: "भेजा जा रहा है...",
    errorEmpty: "कृपया वेबसाइट का लिंक जोड़ें।",
    errorInvalid: "यह लिंक सही नहीं लग रहा। चिह्नित खाने को जाँचें।",
    errorRejected: "यह नहीं हो पाया। लिंक जाँचें और फिर से कोशिश करें।",
    errorNetwork: "यह नहीं हो पाया। फिर से कोशिश करें।",
  },
  thanks: {
    title: "धन्यवाद!",
    shared: {
      one: "आपने {language} के लिए {count} लिंक साझा किया।",
      other: "आपने {language} के लिए {count} लिंक साझा किए।",
    },
    alreadyHad: { one: "{count} लिंक पहले से हमारी सूची में था।", other: "{count} लिंक पहले से हमारी सूची में थे।" },
    allDuplicates: "ये लिंक पहले से हमारी सूची में हैं।",
    addMore: "और जोड़ें",
  },
  lists: {
    listed: "पहले से सूची में",
    recent: "हाल ही में जोड़े गए",
    none: "अभी कोई नहीं",
    loading: "लोड हो रहा है...",
    more: "और देखें",
    less: "कम देखें",
    loadFailed: "यह सूची लोड नहीं हो पाई। फिर से कोशिश करने के लिए पेज दोबारा लोड करें।",
  },
};

export default hi;
