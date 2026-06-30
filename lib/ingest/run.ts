import crypto from "crypto";
import Parser from "rss-parser";
import { FEEDS, googleNewsSearchFeed, type Feed } from "@/lib/sources/feeds";
import { fetchTrendingTopics } from "@/lib/sources/trends";
import { clusterItems } from "@/lib/sources/cluster";
import { fetchArticlePage } from "@/lib/sources/fulltext";
import { getAIProvider } from "@/lib/ai";
import { fetchImage } from "@/lib/images/unsplash";
import { extractRssImage, pickSourceImage } from "@/lib/images/source";
import { loadArticles, saveArticles } from "@/lib/store";
import { isCategory, type Article, type ArticleSource } from "@/lib/types";

const MAX_PER_FEED = 6;
const MAX_TRENDS = 5;
const MAX_AGE_DAYS = 3;

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 CoreHUB" },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

interface Candidate {
  title: string;
  content: string;
  link: string;
  sourceName: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface IngestResult {
  added: number;
  total: number;
  messages: string[];
}

function maxArticlesPerRun(): number {
  const n = Number(process.env.INGEST_MAX_PER_RUN ?? "12");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 12;
}

function idFor(links: string[]): string {
  const key = [...links].sort().join("|");
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

const FILLER_RE =
  /(iletişime geç|takip (edilmeli|etmek|edilmesi)|değerlendiril(meli|mesi)|önlem(ler)? al[ıi]n|daha fazla bilgi için|en uygun ol(acak|ur)|gözden geçiril|önemini .{0,20}(vurgula|göster|ortaya koy|hat[ıi]rlat|kan[ıi]tl)|göz önünde bulundur|dikkat çek|merakla beklen)/i;

function cleanBody(body: string): string {
  const paras = body.split("\n\n").map((p) => p.trim()).filter(Boolean);
  for (let k = 0; k < 2 && paras.length > 2; k++) {
    if (FILLER_RE.test(paras[paras.length - 1])) paras.pop();
    else break;
  }
  return paras.join("\n\n");
}

async function collectCandidates(feeds: Feed[], seen: Set<string>, log: string[]): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const seenLinks = new Set<string>();

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, MAX_PER_FEED);
      let count = 0;

      for (const item of items) {
        const link = item.link?.trim();
        if (!link || seenLinks.has(link)) continue;
        if (seen.has(idFor([link]))) continue;

        if (item.isoDate) {
          const ageDays = (Date.now() - new Date(item.isoDate).getTime()) / 86400000;
          if (ageDays > MAX_AGE_DAYS) continue;
        }

        const content = stripHtml(
          item.contentSnippet || item.content || item.summary || item.title || "",
        );
        if (content.length < 40) continue;

        seenLinks.add(link);
        const rssImage = extractRssImage(item, link);
        out.push({
          title: item.title || "",
          content,
          link,
          sourceName: feed.name,
          publishedAt: item.isoDate || new Date().toISOString(),
          ...(rssImage ? { imageUrl: rssImage } : {}),
        });
        count++;
      }
      log.push(`[${feed.name}] ${count} aday haber`);
    } catch (err) {
      log.push(`[${feed.name}] feed okunamadı: ${(err as Error).message}`);
    }
  }
  return out;
}

export async function runIngest(): Promise<IngestResult> {
  const messages: string[] = [];
  const maxRun = maxArticlesPerRun();
  messages.push(`CoreHUB ingest başlıyor (max ${maxRun}/run)...`);

  const ai = getAIProvider();
  messages.push(`AI sağlayıcı: ${ai.name}`);

  const existing = await loadArticles();
  const seen = new Set(existing.map((a) => a.id));

  const trends = await fetchTrendingTopics(MAX_TRENDS);
  const trendFeeds: Feed[] = trends.map((topic) => ({
    name: `Gündem: ${topic}`,
    url: googleNewsSearchFeed(topic),
    category: "gundem",
  }));
  if (trends.length) messages.push(`Google Trends TR: ${trends.join(", ")}`);

  const candidates = await collectCandidates([...FEEDS, ...trendFeeds], seen, messages);
  messages.push(`Toplam ${candidates.length} aday haber toplandı.`);

  const clusters = clusterItems(candidates);
  const multi = clusters.filter((c) => c.length > 1).length;
  const multiClusters = clusters.filter((c) => c.length > 1);
  const singleClusters = clusters.filter((c) => c.length === 1);
  for (let i = singleClusters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [singleClusters[i], singleClusters[j]] = [singleClusters[j], singleClusters[i]];
  }
  const orderedClusters = [...multiClusters, ...singleClusters];
  messages.push(`${clusters.length} küme oluştu (${multi} tanesi çok-kaynaklı).`);

  const fresh: Article[] = [];
  for (const cluster of orderedClusters) {
    if (fresh.length >= maxRun) break;

    const links = cluster.map((c) => c.link);
    const id = idFor(links);
    if (seen.has(id)) continue;

    try {
      const pages = await Promise.all(cluster.map((c) => fetchArticlePage(c.link)));
      const items = cluster.map((c, i) => ({
        sourceName: c.sourceName,
        title: c.title,
        content: pages[i].text ?? c.content,
      }));
      const youtubeId = pages.find((p) => p.youtubeId)?.youtubeId ?? undefined;

      const out = await ai.synthesize({ items });

      const sourceImg = pickSourceImage(cluster, pages.map((p) => p.imageUrl));
      const unsplash = sourceImg ? null : await fetchImage(out.imageQuery);

      const category = isCategory(out.category) ? out.category : "gundem";
      const sources: ArticleSource[] = cluster.map((c) => ({
        name: c.sourceName,
        url: c.link,
      }));
      const publishedAt = cluster
        .map((c) => c.publishedAt)
        .sort()
        .reverse()[0];

      fresh.push({
        id,
        title: out.title,
        summary: out.summary,
        body: cleanBody(out.body),
        category,
        sources,
        divergenceNote: out.divergenceNote,
        perspectives: out.perspectives,
        publishedAt,
        ingestedAt: new Date().toISOString(),
        imageUrl: sourceImg?.url ?? unsplash?.imageUrl,
        imageCredit: sourceImg?.credit ?? unsplash?.imageCredit,
        imageLink: sourceImg?.link ?? unsplash?.imageLink,
        youtubeId,
      });
      seen.add(id);
      await saveArticles([...existing, ...fresh]);
      const tag = cluster.length > 1 ? `[${cluster.length} kaynak]` : "";
      messages.push(`✓ (${fresh.length}) ${out.title} ${tag}`);
    } catch (err) {
      messages.push(`✗ İşlenemedi: ${cluster[0].title} — ${(err as Error).message}`);
    }
  }

  const total = existing.length + fresh.length;
  messages.push(
    fresh.length > 0
      ? `✅ ${fresh.length} yeni haber eklendi. Toplam: ${total}`
      : "ℹ️ Yeni haber yok.",
  );

  return { added: fresh.length, total, messages };
}
