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
  "maci", "mac", "on", "oncesi", "tahmin", "tahmini", "analiz", "analizleri",
  "yayin", "baglanti", "baglantisi", "link", "dev", "randevu", "kozlarini",
  "the", "and", "for", "with", "from", "you", "are", "cup", "world", "dunya",
  "kupasi", "2026", "2025",
]);

const TEAM_ALIASES: Record<string, string> = {
  fran: "fr", fransa: "fr", france: "fr",
  isve: "se", isvec: "se", swed: "se", sweden: "se",
  norv: "no", norvec: "no", norway: "no",
  fili: "ci", fild: "ci", ivory: "ci", sahili: "ci",
  coventry: "cv", city: "cv",
  lamp: "lp", lampard: "lp", frank: "lp",
  ispan: "es", ispanya: "es", spain: "es",
  alman: "de", almanya: "de", germany: "de",
  ingi: "gb", ingiltere: "gb", england: "gb",
};

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

function stem(tok: string): string {
  return tok.length > 4 ? tok.slice(0, 4) : tok;
}

function normalizeTeamToken(raw: string): string {
  const clean = raw.replace(/[^a-z0-9]/g, "");
  if (!clean) return "";
  return TEAM_ALIASES[clean] ?? TEAM_ALIASES[stem(clean)] ?? stem(clean);
}

/** "Fransa - İsveç maçı" gibi karşılaşmalardan stabil olay anahtarı üretir. */
export function matchEventKey(title: string): string | null {
  const folded = foldTr(title);
  const dash = folded.match(/\b([a-z]{3,})\s*[-–—]\s*([a-z]{3,})/);
  if (!dash) return null;

  const left = normalizeTeamToken(dash[1]);
  const right = normalizeTeamToken(dash[2]);
  if (!left || !right || left === right) return null;
  return [left, right].sort().join("|");
}

function tokenize(title: string): Set<string> {
  const noPublisher = title.replace(/\s[-–|]\s[^-–|]*$/, "");
  const folded = foldTr(noPublisher).replace(/[^a-z0-9\s]/g, " ");
  const toks = new Set(
    folded
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !STOP.has(t))
      .map(stem),
  );

  const eventKey = matchEventKey(title);
  if (eventKey) {
    for (const part of eventKey.split("|")) toks.add(`@${part}`);
  }
  return toks;
}

function jaccard(a: Set<string>, b: Set<string>): { score: number; shared: number } {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return { score: union === 0 ? 0 : inter / union, shared: inter };
}

/** İki başlık aynı olayı mı anlatıyor? (ingest dedup + küme birleştirme) */
export function sameEventTitles(a: string, b: string): boolean {
  const fa = foldTr(a).replace(/\s+/g, " ").trim();
  const fb = foldTr(b).replace(/\s+/g, " ").trim();
  if (!fa || !fb) return false;
  if (fa === fb) return true;

  const keyA = matchEventKey(a);
  const keyB = matchEventKey(b);
  if (keyA && keyB && keyA === keyB) return true;

  const { score, shared } = jaccard(tokenize(a), tokenize(b));
  if (shared >= 4 && score >= 0.32) return true;
  if (shared >= 3 && score >= 0.42) return true;
  if (shared >= 2 && score >= 0.52) return true;
  return false;
}

export function representativeTitle<T extends Clusterable>(cluster: T[]): string {
  return cluster.reduce((best, c) => (c.title.length > best.length ? c.title : best), "");
}

// Aynı olayı anlatan haberleri kümeler.
export function clusterItems<T extends Clusterable>(
  items: T[],
  threshold = 0.18,
  minShared = 2,
): T[][] {
  const clusters: { tokens: Set<string>; items: T[] }[] = [];

  for (const item of items) {
    const toks = tokenize(item.title);
    let best: { tokens: Set<string>; items: T[] } | null = null;
    let bestScore = 0;

    for (const c of clusters) {
      const rep = representativeTitle(c.items);
      if (sameEventTitles(item.title, rep)) {
        best = c;
        bestScore = 1;
        break;
      }
      const { score, shared } = jaccard(toks, c.tokens);
      if (score >= threshold && shared >= minShared && score > bestScore) {
        bestScore = score;
        best = c;
      }
    }

    if (best) best.items.push(item);
    else clusters.push({ tokens: toks, items: [item] });
  }

  return clusters.map((c) => c.items);
}

/** Aynı run içinde birbirine yakın kümeleri tek kümeye indirger. */
export function mergeSimilarClusters<T extends Clusterable>(clusters: T[][]): T[][] {
  const merged: T[][] = [];

  for (const cluster of clusters) {
    const rep = representativeTitle(cluster);
    let target: T[] | null = null;

    for (const existing of merged) {
      if (sameEventTitles(rep, representativeTitle(existing))) {
        target = existing;
        break;
      }
    }

    if (target) target.push(...cluster);
    else merged.push([...cluster]);
  }

  return merged;
}
