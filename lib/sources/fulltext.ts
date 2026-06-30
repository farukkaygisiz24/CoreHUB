// Kaynak haber sayfasının TAM metnini çeker (RSS özeti çok kısa kaldığı için).
// Bağımlılık gerektirmez: HTML'i çekip <p> bloklarından gövde metnini çıkarır.
// Başarısız olursa null döner → ingest RSS özetine geri düşer.
// NOT: Çıktı yalnızca modele GİRDİ olarak kullanılır; sitede birebir yayınlanmaz.

import { extractOgImage } from "@/lib/images/source";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export interface ArticlePage {
  text: string | null; // gövde metni (yoksa null → RSS özetine düşülür)
  youtubeId: string | null; // sayfada bulunan YouTube videosu
  imageUrl: string | null; // og:image / twitter:image
}

// HTML'den ilk YouTube video ID'sini çıkar (iframe embed / youtu.be / watch?v=)
function extractYouTubeId(html: string): string | null {
  const patterns = [
    /(?:youtube(?:-nocookie)?\.com\/embed\/)([A-Za-z0-9_-]{11})/i,
    /(?:youtu\.be\/)([A-Za-z0-9_-]{11})/i,
    /(?:youtube\.com\/watch\?v=)([A-Za-z0-9_-]{11})/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

export async function fetchArticlePage(url: string): Promise<ArticlePage> {
  const empty: ArticlePage = { text: null, youtubeId: null, imageUrl: null };
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return empty;
    if (!(res.headers.get("content-type") || "").includes("text/html")) return empty;

    const rawHtml = await res.text();
    const youtubeId = extractYouTubeId(rawHtml);
    const imageUrl = extractOgImage(rawHtml, url);
    let html = rawHtml;
    // İçerik dışı blokları at
    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
      .replace(/<header[\s\S]*?<\/header>/gi, " ")
      .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
      .replace(/<aside[\s\S]*?<\/aside>/gi, " ");

    // <p> bloklarından paragrafları çıkar
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) => stripTags(m[1]))
      .filter((s) => s.length >= 50);

    // Tekrarları ele
    const seen = new Set<string>();
    const uniq: string[] = [];
    for (const p of paras) {
      if (!seen.has(p)) {
        seen.add(p);
        uniq.push(p);
      }
    }

    const joined = uniq.join("\n\n");
    const text = joined.length < 250 ? null : joined.slice(0, 5000); // token'ı sınırla
    return { text, youtubeId, imageUrl };
  } catch {
    return empty;
  }
}
