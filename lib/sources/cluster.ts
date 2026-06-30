// Farklı kaynaklardan gelen, AYNI olayı anlatan haberleri gruplar.
// Başlık benzerliğine (anlamlı kök örtüşmesi) dayalı, bedava ve hızlı bir
// sezgisel yöntem. Embedding/LLM gerektirmez.
// Sistemin "can damarı": ne kadar iyi eşleştirirse, doğrulama o kadar anlamlı olur.

export interface Clusterable {
  title: string;
}

// Sık geçen, ayırt edici olmayan kelimeler (ASCII-folded biçimde tutulur).
const STOP = new Set([
  "icin", "ile", "ama", "veya", "gibi", "daha", "cok", "bir", "bu", "su", "olan",
  "oldu", "oldugu", "olacak", "yeni", "son", "dakika", "haber", "haberler",
  "aciklama", "aciklamasi", "sonra", "once", "kadar", "gore", "hakkinda",
  "uzerine", "karsi", "buyuk", "turkiye", "turk", "yil", "gun", "sonrasi",
  "canli", "video", "foto", "galeri", "ozel", "iste", "neden", "nasil",
  "the", "and", "for", "with", "from", "you", "are",
]);

// Türkçe karakterleri ASCII'ye indir (eşleştirme dayanıklılığı için).
function foldTr(s: string): string {
  return s
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

// Kaba Türkçe kök bulma: 4 harften uzun kelimeleri ilk 4 harfe indirger
// (faiz/faizi → faiz, banka/bankasi/bankanin → bank, karar/karari → kara).
// Çekim eklerini tutarlı şekilde eler; kısa kelimeler olduğu gibi kalır.
function stem(tok: string): string {
  return tok.length > 4 ? tok.slice(0, 4) : tok;
}

function tokenize(title: string): Set<string> {
  const noPublisher = title.replace(/\s[-–|]\s[^-–|]*$/, ""); // " - Yayıncı" sonekini at
  const folded = foldTr(noPublisher).replace(/[^a-z0-9\s]/g, " ");
  const toks = folded
    .split(/\s+/)
    .filter((t) => t.length >= 3 && !STOP.has(t))
    .map(stem);
  return new Set(toks);
}

function jaccard(a: Set<string>, b: Set<string>): { score: number; shared: number } {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return { score: union === 0 ? 0 : inter / union, shared: inter };
}

// Aynı olayı anlatan haberleri kümeler.
// - Küme TEMSİLCİSİNİN (ilk haber) kökleriyle karşılaştırılır → sürüklenme yok.
// - Eşik + minimum ortak kök şartı → yanlış birleştirme önlenir.
export function clusterItems<T extends Clusterable>(
  items: T[],
  threshold = 0.2,
  minShared = 2
): T[][] {
  const clusters: { tokens: Set<string>; items: T[] }[] = [];

  for (const item of items) {
    const toks = tokenize(item.title);
    let best: { tokens: Set<string>; items: T[] } | null = null;
    let bestScore = 0;

    for (const c of clusters) {
      const { score, shared } = jaccard(toks, c.tokens);
      if (score >= threshold && shared >= minShared && score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    if (best) best.items.push(item);
    else clusters.push({ tokens: toks, items: [item] }); // temsilci kökleri sabit kalır
  }

  return clusters.map((c) => c.items);
}
