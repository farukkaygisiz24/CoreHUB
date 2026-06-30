import type { Category } from "@/lib/types";

// Haber kaynakları. NOT: Kategori artık AI tarafından İÇERİĞE göre belirleniyor;
// buradaki "category" yalnızca bir İPUCU/YEDEK (AI geçersiz cevap verirse kullanılır).
// Yeni kaynak eklemek için tek satır eklemek yeterli.
export interface Feed {
  name: string;
  url: string;
  category: Category; // ipucu/yedek
}

export const FEEDS: Feed[] = [
  // --- Genel gündem / ajanslar (güvenilir) ---
  { name: "NTV Gündem", url: "https://www.ntv.com.tr/gundem.rss", category: "gundem" },
  { name: "Anadolu Ajansı", url: "https://www.aa.com.tr/tr/rss/default?cat=guncel", category: "gundem" },
  { name: "Google News TR", url: "https://news.google.com/rss?hl=tr&gl=TR&ceid=TR:tr", category: "gundem" },

  // --- Çok sesli yelpaze: aynı olayı farklı yayın çizgilerinden yakalamak için.
  // "Ayna" (perspectives) sistemi bunların çerçeve farkını tarafsız gösterir. ---
  { name: "Cumhuriyet", url: "https://www.cumhuriyet.com.tr/rss/son_dakika.xml", category: "gundem" },
  { name: "Sözcü", url: "https://www.sozcu.com.tr/rss/gundem.xml", category: "gundem" },
  // T24'ün kendi RSS'i bozuk XML; Google News site araması üzerinden geçerli RSS alıyoruz.
  { name: "T24", url: "https://news.google.com/rss/search?q=site:t24.com.tr%20when:2d&hl=tr&gl=TR&ceid=TR:tr", category: "gundem" },
  { name: "Sabah", url: "https://www.sabah.com.tr/rss/gundem.xml", category: "gundem" },
  { name: "A Haber", url: "https://www.ahaber.com.tr/rss/anasayfa.xml", category: "gundem" },
  { name: "Hürriyet", url: "https://www.hurriyet.com.tr/rss/gundem", category: "gundem" },
  { name: "Habertürk", url: "https://www.haberturk.com/rss", category: "gundem" },
  { name: "TRT Haber", url: "https://www.trthaber.com/manset_articles.rss", category: "gundem" },
  { name: "Halk TV", url: "https://halktv.com.tr/rss", category: "gundem" },
  // BirGün'ün kendi RSS'i 404; Google News site araması üzerinden alıyoruz.
  { name: "BirGün", url: "https://news.google.com/rss/search?q=site:birgun.net%20when:2d&hl=tr&gl=TR&ceid=TR:tr", category: "gundem" },
  { name: "Gazete Duvar", url: "https://www.gazeteduvar.com.tr/rss", category: "gundem" },
  { name: "Yeni Şafak", url: "https://www.yenisafak.com/Rss", category: "gundem" },
  { name: "Star", url: "https://www.star.com.tr/rss/rss.asp", category: "gundem" },
  { name: "Milliyet", url: "https://www.milliyet.com.tr/rss/rssNew/gundemRss.xml", category: "gundem" },
  { name: "CNN Türk", url: "https://www.cnnturk.com/feed/rss/all/news", category: "gundem" },

  // --- Dünya / Uluslararası bakış ---
  { name: "NTV Dünya", url: "https://www.ntv.com.tr/dunya.rss", category: "dunya" },
  { name: "BBC Türkçe", url: "https://feeds.bbci.co.uk/turkce/rss.xml", category: "dunya" },
  { name: "DW Türkçe", url: "https://rss.dw.com/rdf/rss-tur-all", category: "dunya" },
  { name: "Euronews TR", url: "https://tr.euronews.com/rss", category: "dunya" },
  // Global devler (İngilizce) — AI okuyup TÜRKÇE yazar. Dünyayı ve dolaylı yoldan
  // Türkiye'yi ilgilendiren gelişmeleri yakalamak için.
  { name: "The New York Times", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", category: "dunya" },
  { name: "BBC News", url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "dunya" },
  { name: "The Guardian", url: "https://www.theguardian.com/world/rss", category: "dunya" },
  { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml", category: "dunya" },

  // --- Ekonomi & Finans ---
  { name: "NTV Ekonomi", url: "https://www.ntv.com.tr/ekonomi.rss", category: "ekonomi" },
  { name: "Google News Ekonomi", url: "https://news.google.com/rss/search?q=ekonomi%20when:2d&hl=tr&gl=TR&ceid=TR:tr", category: "ekonomi" },

  // --- Teknoloji ---
  { name: "ShiftDelete", url: "https://shiftdelete.net/feed", category: "teknoloji" },
  { name: "Webtekno", url: "https://www.webtekno.com/rss.xml", category: "teknoloji" },
  { name: "Technopat", url: "https://www.technopat.net/feed/", category: "teknoloji" },
  { name: "NTV Teknoloji", url: "https://www.ntv.com.tr/teknoloji.rss", category: "teknoloji" },

  // --- Yapay Zeka ---
  { name: "Google News Yapay Zeka", url: "https://news.google.com/rss/search?q=yapay%20zeka%20when:3d&hl=tr&gl=TR&ceid=TR:tr", category: "yapay-zeka" },

  // --- Spor --- (NTV spor RSS bozuk; Google News kullanıyoruz)
  { name: "Google News Spor", url: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=tr&gl=TR&ceid=TR:tr", category: "spor" },

  // --- Bilim ---
  { name: "Google News Bilim", url: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=tr&gl=TR&ceid=TR:tr", category: "bilim" },

  // --- Sağlık ---
  { name: "NTV Sağlık", url: "https://www.ntv.com.tr/saglik.rss", category: "saglik" },

  // --- Otomobil ---
  { name: "NTV Otomobil", url: "https://www.ntv.com.tr/otomobil.rss", category: "otomobil" },
];

// Google News arama RSS'i üreten yardımcı (Google Trends konuları için kullanılır).
export function googleNewsSearchFeed(query: string): string {
  const q = encodeURIComponent(`${query} when:2d`);
  return `https://news.google.com/rss/search?q=${q}&hl=tr&gl=TR&ceid=TR:tr`;
}
