import type { Article } from "@/lib/types";

// "Doğrulama / Güven" skoru.
// DİKKAT: Bu, haberin MUTLAK doğruluğunu ölçmez (algoritma bunu yapamaz).
// Ölçtüğü şey: haberi kaç BAĞIMSIZ kaynağın doğruladığı + kaynakların uyumu.
// Mevcut Article verisinden türetilir; ingest'e dokunmaz, ek maliyet yoktur.

export type CredibilityLevel = "high" | "medium" | "low";

export interface Credibility {
  score: number; // 0-100
  level: CredibilityLevel;
  sourceCount: number;
  diverging: boolean;
  label: string; // okuyucuya gösterilecek kısa açıklama
}

export function getCredibility(article: Article): Credibility {
  const sourceCount = article.sources.length;
  const diverging = Boolean(article.divergenceNote);

  // Kaç bağımsız kaynak doğruladı → temel skor
  let score: number;
  if (sourceCount >= 4) score = 95;
  else if (sourceCount === 3) score = 88;
  else if (sourceCount === 2) score = 76;
  else score = 50; // tek kaynak — bağımsız doğrulama yok

  // Kaynaklar çelişiyorsa güven düşer
  if (diverging) score -= 22;
  score = Math.max(0, Math.min(100, score));

  const level: CredibilityLevel =
    score >= 85 ? "high" : score >= 65 ? "medium" : "low";

  const label =
    sourceCount <= 1
      ? "Tek kaynak — bağımsız doğrulama yok"
      : diverging
        ? `${sourceCount} kaynak haber verdi ama anlatıları çelişiyor`
        : `${sourceCount} bağımsız kaynak doğruladı`;

  return { score, level, sourceCount, diverging, label };
}
