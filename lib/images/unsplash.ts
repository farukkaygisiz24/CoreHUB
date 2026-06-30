// Unsplash'ten telifsiz görsel çeker. Anahtar yoksa sessizce boş döner
// (site görselsiz de çalışır). Unsplash atıf zorunluluğu için
// fotoğrafçı adı ve profili de döndürülür.

export interface ImageResult {
  imageUrl: string;
  imageCredit: string;
  imageLink: string;
}

export async function fetchImage(query: string): Promise<ImageResult | null> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return null;

  try {
    const url = new URL("https://api.unsplash.com/search/photos");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");
    url.searchParams.set("content_filter", "high");

    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      signal: AbortSignal.timeout(15000), // asılı kalmasın
    });
    if (!res.ok) return null;

    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    return {
      imageUrl: photo.urls?.regular ?? photo.urls?.small,
      imageCredit: photo.user?.name ?? "Unsplash",
      imageLink: photo.user?.links?.html ?? "https://unsplash.com",
    };
  } catch {
    return null;
  }
}
