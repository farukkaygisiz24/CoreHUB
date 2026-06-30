// RSS ve kaynak haber sayfasından görsel URL'si çıkarır.
// Hotlink — telif riski kullanıcıya aittir; Unsplash yedek kalır.

import type { Item } from "rss-parser";

type RssItem = Item & {
  mediaContent?: { $?: { url?: string; type?: string } };
  mediaThumbnail?: { $?: { url?: string } };
  contentEncoded?: string;
};

const SKIP_RE = /(?:logo|icon|avatar|sprite|pixel|1x1|spacer|emoji|badge)/i;

export function normalizeImageUrl(raw: string, pageUrl?: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;

  try {
    const url = pageUrl ? new URL(trimmed, pageUrl) : new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (SKIP_RE.test(url.pathname)) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function extractRssImage(item: RssItem, feedPageUrl?: string): string | null {
  const enc = item.enclosure;
  if (enc?.url && (!enc.type || enc.type.startsWith("image/"))) {
    const u = normalizeImageUrl(enc.url, feedPageUrl);
    if (u) return u;
  }

  const media =
    item.mediaContent?.$?.url ||
    item.mediaThumbnail?.$?.url ||
    (item as { "media:content"?: { url?: string } })["media:content"]?.url;
  if (media) {
    const u = normalizeImageUrl(media, feedPageUrl);
    if (u) return u;
  }

  const html = item.content || item.contentEncoded || "";
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match?.[1]) {
    const u = normalizeImageUrl(match[1], item.link || feedPageUrl);
    if (u) return u;
  }

  return null;
}

export function extractOgImage(html: string, pageUrl: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ];

  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const u = normalizeImageUrl(m[1], pageUrl);
      if (u) return u;
    }
  }
  return null;
}

export interface SourceImagePick {
  url: string;
  credit: string;
  link: string;
}

export function pickSourceImage(
  candidates: { imageUrl?: string; sourceName: string; link: string }[],
  pageImages: (string | null | undefined)[],
): SourceImagePick | null {
  for (const c of candidates) {
    if (c.imageUrl) {
      return { url: c.imageUrl, credit: c.sourceName, link: c.link };
    }
  }
  for (let i = 0; i < pageImages.length; i++) {
    const url = pageImages[i];
    if (url && candidates[i]) {
      return { url, credit: candidates[i].sourceName, link: candidates[i].link };
    }
  }
  return null;
}
