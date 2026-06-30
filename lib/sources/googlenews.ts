// Google News RSS linkleri news.google.com yönlendirmesidir; gerçek yayıncı URL'sine çözülür.
// Post-2024 formatı batchexecute ile decode gerektirir (google-news-url-decoder).

import { GoogleDecoder } from "google-news-url-decoder";

const decoder = new GoogleDecoder();

const GOOGLE_NEWS_RE = /^https?:\/\/news\.google\.com\//i;

export function isGoogleNewsUrl(url: string): boolean {
  return GOOGLE_NEWS_RE.test(url);
}

export async function resolveGoogleNewsUrl(url: string): Promise<string> {
  if (!isGoogleNewsUrl(url)) return url;
  try {
    const result = (await decoder.decode(url)) as {
      status?: boolean;
      decoded_url?: string;
    };
    if (result.status && result.decoded_url) return result.decoded_url;
  } catch {
    // decode başarısız → orijinal link
  }
  return url;
}

/** Google News linklerini yayıncı URL'sine çevirir; diğerleri aynen kalır. */
export async function resolveArticleUrls(urls: string[]): Promise<string[]> {
  const googleIdx: number[] = [];
  const googleUrls: string[] = [];
  const out = [...urls];

  for (let i = 0; i < urls.length; i++) {
    if (isGoogleNewsUrl(urls[i]!)) {
      googleIdx.push(i);
      googleUrls.push(urls[i]!);
    }
  }

  if (!googleUrls.length) return out;

  try {
    const batch = (await decoder.decodeBatch(googleUrls)) as Array<{
      status?: boolean;
      decoded_url?: string;
      source_url?: string;
    }>;
    for (let j = 0; j < googleIdx.length; j++) {
      const res = batch[j];
      if (res?.status && res.decoded_url) out[googleIdx[j]!] = res.decoded_url;
    }
  } catch {
    await Promise.all(
      googleIdx.map(async (idx) => {
        out[idx] = await resolveGoogleNewsUrl(urls[idx]!);
      }),
    );
  }

  return out;
}
