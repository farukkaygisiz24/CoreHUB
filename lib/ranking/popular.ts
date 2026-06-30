import type { Article, Category } from "@/lib/types";

const CATEGORY_BOOST: Partial<Record<Category, number>> = {
  gundem: 35,
  dunya: 22,
  spor: 20,
  ekonomi: 18,
  teknoloji: 12,
  "yapay-zeka": 14,
  saglik: 10,
  bilim: 8,
  otomobil: 8,
};

const POPULAR_WINDOW_HOURS = 72;

function recencyScore(publishedAt: string): number {
  const hours = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (hours > POPULAR_WINDOW_HOURS) return 0;
  return Math.round(28 * (1 - hours / POPULAR_WINDOW_HOURS));
}

function trendScore(article: Article, trends: string[]): number {
  if (trends.length === 0) return 0;
  const text = `${article.title} ${article.summary}`.toLocaleLowerCase("tr-TR");

  let best = 0;
  for (let i = 0; i < trends.length; i++) {
    const trend = trends[i]!.toLocaleLowerCase("tr-TR");
    if (text.includes(trend)) {
      best = Math.max(best, 45 - i * 4);
      continue;
    }
    const words = trend.split(/\s+/).filter((w) => w.length > 3);
    if (words.length === 0) continue;
    const hits = words.filter((w) => text.includes(w)).length;
    if (hits >= Math.ceil(words.length * 0.6)) {
      best = Math.max(best, 32 - i * 3);
    }
  }
  return best;
}

function sourceScore(article: Article): number {
  const n = article.sources.length;
  if (n <= 1) return 0;
  return (n - 1) * 22 + (n >= 3 ? 12 : 0);
}

export function scoreArticle(article: Article, trends: string[]): number {
  let score = 0;
  score += CATEGORY_BOOST[article.category] ?? 5;
  score += recencyScore(article.publishedAt);
  score += trendScore(article, trends);
  score += sourceScore(article);
  if (article.imageUrl) score += 8;
  if (article.divergenceNote) score += 6;
  return score;
}

/** Gündemi meşgul eden haberler — son eklenen değil, skor tabanlı sıralama. */
export function getPopularArticles(
  articles: Article[],
  trends: string[],
  limit = 10,
): Article[] {
  const recent = articles.filter((a) => {
    const hours = (Date.now() - new Date(a.publishedAt).getTime()) / 3_600_000;
    return hours <= POPULAR_WINDOW_HOURS * 2;
  });

  const pool = recent.length >= limit ? recent : articles;

  return [...pool]
    .map((a) => ({ article: a, score: scoreArticle(a, trends) }))
    .sort((a, b) => b.score - a.score || new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime())
    .slice(0, limit)
    .map(({ article }) => article);
}
