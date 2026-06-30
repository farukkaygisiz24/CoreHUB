// AI sağlayıcı sözleşmesi (provider contract).
// Her sağlayıcı (Gemini, Groq, Claude...) bu arayüzü uygular.
// Sistemin geri kalanı hangi modeli kullandığımızı BİLMEZ.

// Aynı olayı anlatan bir kaynağın ham hali
export interface SourceItem {
  sourceName: string;
  title: string;
  content: string;
}

// Bir veya birden çok kaynağı sentezleme girdisi
export interface SynthesizeInput {
  items: SourceItem[]; // 1 eleman = tek kaynak; >1 = çok-kaynaklı kıyaslama
}

// Bir kaynağın olayı nasıl çerçevelediği (tarafsız aktarım, "ayna")
export interface SourcePerspective {
  source: string; // kaynak adı
  framing: string; // o kaynağın olayı sunuş/vurgu biçimi (nötr dille)
}

export interface SynthesizeOutput {
  title: string; // tarafsız başlık
  summary: string; // kısa özet (kart için, 2-3 cümle)
  body: string; // uzun gövde metni (detay sayfası için, paragraflar)
  imageQuery: string; // görsel arama için İngilizce anahtar kelime (Unsplash)
  category: string; // AI'nın içeriğe bakarak seçtiği kategori slug'ı
  // Kaynaklar olayı çelişkili aktarıyorsa kısa not; uyumluysa/tek kaynaksa boş.
  divergenceNote?: string;
  // Kaynaklar olayı FARKLI çerçeveliyorsa her birinin bakışı (tarafsız). Yoksa boş.
  perspectives?: SourcePerspective[];
}

export interface AIProvider {
  name: string;
  synthesize(input: SynthesizeInput): Promise<SynthesizeOutput>;
}

// Modelden gelen "perspectives" alanını güvenli biçime indir (bozuksa boş dizi).
export function sanitizePerspectives(raw: unknown): SourcePerspective[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (p): p is SourcePerspective =>
        !!p && typeof p.source === "string" && typeof p.framing === "string"
    )
    .map((p) => ({ source: p.source.trim(), framing: p.framing.trim() }))
    .filter((p) => p.source && p.framing)
    .slice(0, 6);
}

// Bir sağlayıcının GÜNLÜK kotası dolduğunda fırlatılır. Zincir bunu yakalayıp
// o sağlayıcıyı atlar ve sıradakine geçer (boşuna tekrar denemez).
export class QuotaExhaustedError extends Error {
  constructor(public providerName: string, message: string) {
    super(message);
    this.name = "QuotaExhaustedError";
  }
}
