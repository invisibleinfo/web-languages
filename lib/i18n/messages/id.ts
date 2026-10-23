import type { Messages } from "./en";

const id: Messages = {
  meta: {
    title: "web-languages — Bagikan situs web dalam bahasamu",
    description:
      "Bantu proyek web-languages dari Common Crawl dengan membagikan situs web dalam bahasamu — tanpa akun GitHub.",
  },
  header: {
    siteLanguage: "Bahasa situs",
  },
  home: {
    title: "Bagikan situs web dalam bahasamu",
    subtitle: "Bantu agar web mencerminkan setiap bahasa yang digunakan manusia. Cari bahasamu dan tambahkan situs yang kamu percaya.",
    statsTotal: "Kami mencatat {total} bahasa yang digunakan manusia.",
    statsWithSources: "Kami mencatat {total} bahasa yang digunakan manusia, dan hanya {percent}% di antaranya yang punya sumber di web.",
  },
  picker: {
    loading: "Memuat bahasa...",
    placeholder: "Cari bahasamu...",
    searchLabel: "Cari bahasamu",
    noMatches: "Tidak ditemukan — coba nama dalam bahasa Inggris atau kode 3 huruf.",
    back: "Pilih bahasa lain",
    loadFailed: "Daftar bahasa gagal dimuat. Periksa koneksimu lalu muat ulang halaman.",
  },
  form: {
    heading: "Tambah situs web",
    linkLabel: "Tautan situs web",
    noteLabel: "Catatan (opsional)",
    notePlaceholder: "mis. Berita lokal",
    remove: "Hapus",
    removeLabel: "Hapus tautan {number}",
    addAnother: "+ Tambah tautan lain",
    send: "Kirim",
    sending: "Mengirim...",
    errorEmpty: "Tambahkan tautan situs web.",
    errorInvalid: "Tautan ini sepertinya salah. Periksa kotak yang ditandai.",
    errorRejected: "Gagal. Periksa tautan lalu coba lagi.",
    errorNetwork: "Gagal. Coba lagi.",
  },
  thanks: {
    title: "Terima kasih!",
    shared: {
      one: "Kamu membagikan {count} tautan untuk {language}.",
      other: "Kamu membagikan {count} tautan untuk {language}.",
    },
    alreadyHad: { one: "{count} sudah ada di daftar kami.", other: "{count} sudah ada di daftar kami." },
    allDuplicates: "Tautan ini sudah ada di daftar kami.",
    addMore: "Tambah lagi",
  },
  lists: {
    listed: "Sudah terdaftar",
    none: "Belum ada",
    loading: "Memuat...",
    more: "Lihat lebih banyak",
    less: "Lihat lebih sedikit",
    loadFailed: "Daftar ini gagal dimuat. Muat ulang halaman untuk mencoba lagi.",
  },
};

export default id;
