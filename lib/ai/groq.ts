import type { AIProvider, SynthesizeInput, SynthesizeOutput } from "./types";
import { QuotaExhaustedError, sanitizePerspectives } from "./types";
import { CATEGORIES } from "@/lib/types";

// Groq: OpenAI uyumlu API, ücretsiz katman cömert ve bölge kısıtı yok.
// SDK gerektirmez, doğrudan fetch ile konuşuruz.

const CATEGORY_LIST = CATEGORIES.map((c) => `${c.slug} (${c.label})`).join(", ");

const SYSTEM_RULES = `Sen deneyimli, tarafsız bir haber yazarı ve editörsün. Sana AYNI
olayı anlatan BİR VEYA BİRDEN ÇOK kaynağın metni verilecek. Bunları KIYASLAYARAK tek,
dengeli ve özgün bir Türkçe haber yaz. Kurallar:
- AYNA İLKESİ: Sen HAKEM DEĞİL AYNASIN. Kaynaklar olayı farklı yorumluyorsa (özellikle
  "iyi/kötü, başarılı/başarısız" gibi DEĞER YARGILARINDA) hangisinin haklı olduğuna ASLA
  karar verme, siyasi taraf tutma. Sadece kimin ne dediğini tarafsız aktar.
- Birden çok kaynak varsa: önce HERKESİN HEMFİKİR olduğu OLGULARI (ne oldu, ne zaman)
  gövdeye yaz. Sonra kaynaklar olayı farklı çerçeveliyorsa her birinin bakışını
  "perspectives" dizisine koy: [{"source":"Kaynak adı","framing":"o kaynağın vurgusu/sunuşu"}].
  Kaynaklar hemfikirse veya tek kaynaksa "perspectives" boş dizi [] olsun.
- ÇELİŞKİ OLGUSALSA (sayı/tarih/olay gibi doğrulanabilir): "divergenceNote"ta hangi
  bilginin daha çok kaynakça/resmi açıklamayca desteklendiğini belirtebilirsin. ÇELİŞKİ
  GÖRÜŞ/YORUMSA: taraf tutma, sadece "kaynaklar bu konuda ayrışıyor" de.
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
- "body": detay sayfası için KAPSAMLI, 5-8 paragraflık özgün metin. Şunları işle: olayın
  özü, arka plan/bağlam, önemli detaylar, ilgili taraflar, olası etkiler. Paragrafları \\n\\n ile ayır.
- ÇOK ÖNEMLİ JSON KURALI: Metin değerlerinin İÇİNDE çift tırnak (") ASLA kullanma (JSON'u
  bozar). Vurgu/alıntı gerekiyorsa tek tırnak (') kullan. Çıktı geçerli JSON olmalı.
- ANTI-DOLGU: tekrar etme, boş/klişe cümle ("önemli bir gelişmedir, takip edilmelidir"
  gibi) kurma. Her paragraf YENİ bir bilgi veya bakış açısı katsın; sadece uzatmak için
  yazma. Bilgi yoksa uzatma — kaliteyi uzunluğa feda etme.
- SOMUT DETAY: Kaynak metinlerinde kadro/ilk 11, skor, maç tarihi-saat, stadyum, yayın
  kanalı veya resmi link geçiyorsa gövdede NET aktar. Kaynakta yoksa başlıkta vaat etme
  (ör. 'kadrolar açıklandı' deyip liste vermeme; 'canlı yayın linki' deyip link yazmama).
- Haberi ASLA öğüt/öneri/temenni cümlesiyle bitirme ("değerlendirilmeli", "önlemler
  alınmalı", "takip edilmeli", "iletişime geçmek en uygun olur" gibi). Haber olgularla
  bitsin, senin yorumun/tavsiyenle değil.
- "imageQuery": konuyu temsil eden 2-4 kelimelik İNGİLİZCE görsel anahtar kelime.
- Çıktıyı SADECE şu JSON formatında ver:
  {"title": "...", "category": "...", "summary": "...", "body": "...", "imageQuery": "...", "divergenceNote": "...", "perspectives": [{"source": "...", "framing": "..."}]}`;

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildUserContent(input: SynthesizeInput): string {
  const blocks = input.items
    .map(
      (it, i) =>
        `KAYNAK ${i + 1} (${it.sourceName})\nBaşlık: ${it.title}\nMetin: ${it.content}`
    )
    .join("\n\n---\n\n");
  const note =
    input.items.length > 1
      ? `Aşağıda AYNI olayı anlatan ${input.items.length} farklı kaynak var. Kıyasla ve sentezle:\n\n`
      : `Aşağıdaki kaynaktan özgün bir haber yaz:\n\n`;
  return note + blocks;
}

export function createGroqProvider(modelOverride?: string): AIProvider {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY tanımlı değil (.env.local)");
  const modelName = modelOverride || process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  return {
    name: `groq:${modelName}`,
    async synthesize(input: SynthesizeInput): Promise<SynthesizeOutput> {
      const userContent = buildUserContent(input);

      let lastErr: Error | null = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        let res: Response;
        try {
          res = await fetch(ENDPOINT, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: modelName,
              response_format: { type: "json_object" },
              temperature: 0.4,
              max_tokens: 3200,
              messages: [
                { role: "system", content: SYSTEM_RULES },
                { role: "user", content: userContent },
              ],
            }),
            // 45 sn'de yanıt gelmezse iptal et (sonsuza kadar asılı kalmasın)
            signal: AbortSignal.timeout(45000),
          });
        } catch (e) {
          lastErr = e as Error; // timeout/ağ hatası — tekrar dene
          continue;
        }

        if (res.status === 429) {
          const body = await res.text();
          // GÜNLÜK kota (TPD/RPD) dolduysa: tekrar deneme, zincirin sonrakine geçmesi
          // için hemen QuotaExhaustedError fırlat.
          if (/per day|tokens? per day|TPD|requests per day|RPD/i.test(body)) {
            throw new QuotaExhaustedError(`groq:${modelName}`, body.slice(0, 160));
          }
          // Dakikalık limit: bekle ve tekrar dene (en fazla 20 sn)
          const retryAfter = Math.min(Number(res.headers.get("retry-after")) || 8, 20);
          await sleep((retryAfter + 1) * 1000);
          lastErr = new Error("Groq 429 (dakikalık limit)");
          continue;
        }

        if (!res.ok) {
          const body = await res.text();
          // 8b bazen geçersiz JSON üretir (kaçışsız tırnak / yarıda kesilme).
          // Stokastik olduğu için AYNI modeli birkaç kez daha dene (döngü içinde).
          if (res.status === 400 && /json_validate_failed|Failed to generate JSON/i.test(body)) {
            lastErr = new Error("Groq 400 json_validate_failed (yeniden denenecek)");
            continue;
          }
          throw new Error(`Groq API hatası ${res.status}: ${body.slice(0, 160)}`);
        }

        const data = await res.json();
        const text = data.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(text) as Partial<SynthesizeOutput>;
        if (!parsed.title || !parsed.summary) {
          throw new Error("Groq beklenen JSON'u döndürmedi");
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
      }

      throw lastErr ?? new Error("Groq isteği başarısız");
    },
  };
}
