import type { AIProvider, SynthesizeInput, SynthesizeOutput } from "./types";
import { QuotaExhaustedError } from "./types";
import { createGeminiProvider } from "./gemini";
import { createGroqProvider } from "./groq";

// Tek bir token'ı ("groq:llama-3.1-8b-instant" / "gemini" / "gemini:model") sağlayıcıya çevirir.
function buildProvider(token: string): AIProvider {
  const [type, ...rest] = token.trim().split(":");
  const model = rest.join(":").trim() || undefined;
  switch (type.trim().toLowerCase()) {
    case "groq":
      return createGroqProvider(model);
    case "gemini":
      return createGeminiProvider(model);
    // case "claude": return createClaudeProvider(model);
    default:
      throw new Error(`Bilinmeyen AI sağlayıcı: ${type}`);
  }
}

// Sıralı sağlayıcı zinciri: ilk sağlayıcıyı kullanır; GÜNLÜK kotası dolunca
// (QuotaExhaustedError) onu işaretleyip sıradakine geçer. Diğer hatalarda da
// sıradakini dener ama sağlayıcıyı kalıcı elemez (geçici olabilir).
class FallbackProvider implements AIProvider {
  name: string;
  private exhausted = new Set<string>();

  constructor(private providers: AIProvider[]) {
    this.name = `chain[${providers.map((p) => p.name).join(" → ")}]`;
  }

  async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
    let lastErr: unknown;
    for (const p of this.providers) {
      if (this.exhausted.has(p.name)) continue;
      try {
        return await p.synthesize(input);
      } catch (e) {
        lastErr = e;
        if (e instanceof QuotaExhaustedError) {
          this.exhausted.add(p.name);
          console.warn(`⚠ ${p.name} günlük kota doldu → sonraki sağlayıcıya geçiliyor`);
        } else {
          console.warn(`⚠ ${p.name} hata: ${(e as Error).message?.slice(0, 80)} → sonraki deneniyor`);
        }
      }
    }
    throw lastErr ?? new Error("Tüm AI sağlayıcılar başarısız oldu");
  }
}

// Sağlayıcı seçici.
// - AI_CHAIN tanımlıysa: virgülle ayrılmış sıralı zincir (örn:
//   "groq:llama-3.3-70b-versatile,groq:llama-3.1-8b-instant")
// - Yoksa AI_PROVIDER (tekli, geriye dönük uyum)
// - O da yoksa makul varsayılan zincir (önce 70b kalite, dolunca 8b)
export function getAIProvider(): AIProvider {
  const chainEnv =
    process.env.AI_CHAIN ||
    process.env.AI_PROVIDER ||
    "groq:llama-3.3-70b-versatile,groq:llama-3.1-8b-instant";

  const tokens = chainEnv.split(",").map((s) => s.trim()).filter(Boolean);
  const providers = tokens.map(buildProvider);
  return providers.length === 1 ? providers[0] : new FallbackProvider(providers);
}

export type { AIProvider } from "./types";
