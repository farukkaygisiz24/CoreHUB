// CoreHUB ortak tipler

// Kategoriler tek kaynaktan tanımlanır; Category tipi bundan türetilir.
// Yeni kategori eklemek için buraya bir satır ekle, tip otomatik güncellenir.
export const CATEGORIES = [
  { slug: "gundem", label: "Gündem" },
  { slug: "dunya", label: "Dünya" },
  { slug: "ekonomi", label: "Ekonomi & Finans" },
  { slug: "teknoloji", label: "Teknoloji" },
  { slug: "yapay-zeka", label: "Yapay Zeka" },
  { slug: "spor", label: "Spor" },
  { slug: "bilim", label: "Bilim" },
  { slug: "saglik", label: "Sağlık" },
  { slug: "otomobil", label: "Otomobil" },
] as const;

export type Category = (typeof CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug) as readonly Category[];

export function isCategory(value: string): value is Category {
  return (CATEGORY_SLUGS as readonly string[]).includes(value);
}

// Bir haberin tek bir kaynağı (kıyaslama için birden çok olabilir)
export interface ArticleSource {
  name: string;
  url: string; // orijinal kaynak — HER ZAMAN korunur
}

// AI tarafından işlenmiş, sitede gösterilen haber
export interface Article {
  id: string; // tekilleştirme için hash
  title: string; // AI'nın ürettiği başlık
  summary: string; // kısa özet (kart için)
  body: string; // uzun gövde metni (detay sayfası için)
  category: Category;
  // Bu habere katkı veren tüm kaynaklar (çok-kaynaklı sentezde >1 olur)
  sources: ArticleSource[];
  // Kaynaklar olayı farklı aktarıyorsa AI'nın notu (yoksa tek kaynak/uyumlu demektir)
  divergenceNote?: string;
  // Kaynaklar olayı farklı çerçeveliyorsa her birinin tarafsız aktarılan bakışı ("ayna")
  perspectives?: { source: string; framing: string }[];
  publishedAt: string;
  ingestedAt: string;
  // Görsel: öncelik kaynak RSS/sayfa; yoksa Unsplash yedek.
  imageUrl?: string;
  imageCredit?: string; // kaynak adı veya Unsplash fotoğrafçısı
  imageLink?: string; // kaynak haber URL'si veya Unsplash profili
  // Kaynak sayfasında bulunan YouTube videosu (resmi iframe ile gömülür)
  youtubeId?: string;
}
