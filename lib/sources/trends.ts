import Parser from "rss-parser";

// Google Trends Türkiye — "şu an ne konuşuluyor" sinyali.
// Sadece trend KONU BAŞLIKLARINI döndürür; gerçek haber Google News'ten çekilir.
// Böylece X'in güvenilmez/ücretli sorunları olmadan "gündem" yakalanır.
const TRENDS_URL = "https://trends.google.com/trending/rss?geo=TR";

export async function fetchTrendingTopics(limit = 5): Promise<string[]> {
  try {
    const parser = new Parser({
      timeout: 15000,
      headers: { "User-Agent": "Mozilla/5.0 CoreHUB" },
    });
    const feed = await parser.parseURL(TRENDS_URL);
    return (feed.items || [])
      .map((i) => i.title?.trim())
      .filter((t): t is string => Boolean(t))
      .slice(0, limit);
  } catch {
    return [];
  }
}
