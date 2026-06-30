import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, SynthesizeInput, SynthesizeOutput } from "./types";
import { sanitizePerspectives } from "./types";
import { CATEGORIES } from "@/lib/types";

const CATEGORY_LIST = CATEGORIES.map((c) => `${c.slug} (${c.label})`).join(", ");

const SYSTEM_RULES = `Sen deneyimli, tarafsız bir haber yazarı ve editörsün. Sana AYNI
olayı anlatan BİR VEYA BİRDEN ÇOK kaynağın metni verilecek. Bunları KIYASLAYARAK tek,
dengeli ve özgün bir Türkçe haber yaz. Kurallar:
- AYNA İLKESİ: Sen HAKEM DEĞİL AYNASIN. Değer yargılarında (iyi/kötü, başarılı/başarısız)
  hangi tarafın haklı olduğuna ASLA karar verme, siyasi taraf tutma; sadece kimin ne
  dediğini tarafsız aktar.
- Birden çok kaynak varsa: önce HERKESİN HEMFİKİR olduğu OLGULARI gövdeye yaz. Sonra
  kaynaklar farklı çerçeveliyorsa her birinin bakışını "perspectives" dizisine koy:
  [{"source":"Kaynak adı","framing":"o kaynağın vurgusu"}]. Hemfikir/tek kaynaksa [].
- ÇELİŞKİ OLGUSALSA (sayı/tarih): "divergenceNote"ta hangisinin daha çok desteklendiğini
  belirtebilirsin. GÖRÜŞ/YORUMSA: taraf tutma, "kaynaklar ayrışıyor" de.
- Kaynaklar uyumluysa veya tek kaynak varsa "divergenceNote" boş ("") olsun.
- Konuyu kendi bilginle bağlamlandır ama DOĞRULUK kritik: emin olmadığın kesin sayı,
  fiyat, tarih, istatistik veya alıntı UYDURMA. Spesifik veriden emin değilsen genel konuş.
- Üslup NESNEL ve DENGELİ olsun: taraf tutma, abartma, reklam yapma.
- Yalnızca düzgün Türkçe yaz; yabancı (Çince vb.) karakter veya kelime KULLANMA.
- MODERASYON: küfür, hakaret, argo, nefret söylemi veya müstehcen ifade KULLANMA.
  İçeriği Türkiye'deki yasalara uygun, ölçülü ve saygılı yaz. Kişilere/kurumlara yönelik
  ispatsız suçlama/iftira içerme; iddiaları "iddia edildi" gibi temkinli aktar.
- Tıklama tuzağı (clickbait) başlık YAZMA. Başlık konuyu net anlatsın.
- "category": haberin İÇERİĞİNE göre şu listeden EN UYGUN slug'ı seç: ${CATEGORY_LIST}.
- "summary": kart için 2-3 cümlelik tanıtıcı özet.
- "body": detay sayfası için KAPSAMLI ve DERİNLEMESİNE, 6-10 paragraflık özgün metin
  (olayın özü, arka plan, detaylar, ilgili taraflar, olası etkiler; paragrafları \\n\\n ile ayır).
- ANTI-DOLGU: tekrar ve boş/klişe cümle kurma. Her paragraf YENİ bilgi katsın; sadece
  uzatmak için yazma. Kaliteyi uzunluğa feda etme. Haberi öğüt/öneri/temenni cümlesiyle
  ("değerlendirilmeli", "takip edilmeli" gibi) BİTİRME; olgularla bitsin.
- "imageQuery": konuyu temsil eden 2-4 kelimelik İNGİLİZCE görsel anahtar kelime.
- Çıktıyı SADECE şu JSON formatında ver:
  {"title": "...", "category": "...", "summary": "...", "body": "...", "imageQuery": "...", "divergenceNote": "...", "perspectives": [{"source": "...", "framing": "..."}]}`;

function buildPrompt(input: SynthesizeInput): string {
  const blocks = input.items
    .map(
      (it, i) =>
        `KAYNAK ${i + 1} (${it.sourceName})\nBaşlık: ${it.title}\nMetin: ${it.content}`
    )
    .join("\n\n---\n\n");
  const note =
    input.items.length > 1
      ? `Aşağıda AYNI olayı anlatan ${input.items.length} farklı kaynak var. Kıyasla ve sentezle:`
      : `Aşağıdaki kaynaktan özgün bir haber yaz:`;
  return `${SYSTEM_RULES}\n\n${note}\n\n${blocks}`;
}

export function createGeminiProvider(modelOverride?: string): AIProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY tanımlı değil (.env.local)");

  const modelName = modelOverride || process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: { responseMimeType: "application/json" },
  });

  return {
    name: `gemini:${modelName}`,
    async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
      const result = await model.generateContent(buildPrompt(input));
      const text = result.response.text();
      const parsed = JSON.parse(text) as Partial<SynthesizeOutput>;

      if (!parsed.title || !parsed.summary) {
        throw new Error("Gemini beklenen JSON'u döndürmedi");
      }
      const divergence = (parsed.divergenceNote || "").trim();
      const perspectives = sanitizePerspectives(parsed.perspectives);
      return {
        title: parsed.title.trim(),
        summary: parsed.summary.trim(),
        body: (parsed.body || parsed.summary).trim(),
        imageQuery: (parsed.imageQuery || "news").trim(),
        category: (parsed.category || "gundem").trim(),
        divergenceNote: divergence.length > 0 ? divergence : undefined,
        perspectives: perspectives.length > 0 ? perspectives : undefined,
      };
    },
  };
}
