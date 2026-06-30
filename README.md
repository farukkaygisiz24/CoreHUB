# CoreHUB

**Tam otomatik, kendi kendini güncelleyen Türkçe haber sitesi.**

CoreHUB; güvenilir RSS kaynaklarından haber toplar, aynı olayı farklı kaynaklarda eşleştirir, yapay zeka ile tarafsız ve özgün Türkçe içerik üretir ve bunu modern bir web arayüzünde yayınlar. Editör yok, manuel müdahale yok — sistem zamanlanmış görevlerle kendi kendine çalışır.

> Bu proje açık kaynaklıdır. Kendi haber siteni kurmak, kaynak listesini genişletmek veya pipeline'ı özelleştirmek için özgürce kullanabilirsin.

---

## İçindekiler

- [Ne yapar?](#ne-yapar)
- [Öne çıkan özellikler](#öne-çıkan-özellikler)
- [Nasıl çalışır?](#nasıl-çalışır)
- [Teknoloji](#teknoloji)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Ortam değişkenleri](#ortam-değişkenleri)
- [Yerel geliştirme](#yerel-geliştirme)
- [Vercel'e deploy](#vercele-deploy)
- [Kaynak ve kategori ekleme](#kaynak-ve-kategori-ekleme)
- [Proje yapısı](#proje-yapısı)
- [Önemli notlar](#önemli-notlar)
- [Katkıda bulunma](#katkıda-bulunma)

---

## Ne yapar?

CoreHUB bir haber **kopyalama** aracı değildir. Kaynak metinleri ilham alır; yapay zeka her haber için:

- Başlık, özet ve detaylı gövde metni yazar
- İçeriğe göre kategori seçer (Gündem, Teknoloji, Spor vb.)
- Birden fazla kaynak varsa ortak noktaları sentezler, çelişkileri işaretler
- Orijinal kaynaklara her zaman link verir

Site tarafında ziyaretçiler kategori sayfalarında gezinir, popüler haberler carousel'inde öne çıkanları görür, haber detayında kaynak doğrulama skorunu ve kaynak linklerini inceler.

---

## Öne çıkan özellikler

### Otomasyon
- Onlarca Türk RSS kaynağından haber toplama
- Google Trends TR ile gündem konularını yakalama
- Aynı olayı farklı kaynaklarda otomatik eşleştirme (kümeleme)
- Zamanlanmış ingest (Vercel Cron veya manuel tetikleme)

### Tarafsızlık ve şeffaflık
- Çok kaynaklı haberlerde kaynak karşılaştırması
- Kaynaklar çelişiyorsa uyarı kutusu (`divergenceNote`)
- Kaynaklar olayı farklı çerçeveliyorsa “Kaynaklar ne dedi?” bölümü
- **Kaynak Doğrulama** skoru: kaç bağımsız kaynağın haberi doğruladığı

### Arayüz
- Açık / koyu tema (tercih tarayıcıda saklanır)
- Liquid glass tasarım ([Ein UI](https://ui.eindev.ir/) bileşenleri)
- Ana sayfada “Gündemi Meşgul Eden” popüler haber carousel'i
- Haber detayında yapışkan kaynak sidebar'ı

### Görseller
- Öncelik: kaynak RSS veya haber sayfası (`og:image`)
- Yedek: Unsplash (API anahtarı varsa)
- Kaynak görseli yoksa kategori gradyanı

### Yapay zeka
- Sağlayıcıdan bağımsız mimari (Groq, Gemini; zincir desteği)
- Günlük kota dolunca otomatik yedek modele geçiş
- Uydurma sayı/tarih/alıntı yasağı; dengeli üslup kuralları

---

## Nasıl çalışır?

```
[RSS kaynakları + Google Trends]
           │
           ▼
    ┌──────────────┐
    │   Ingest     │  ← npm run ingest  veya  /api/cron/ingest
    └──────────────┘
           │
           ├─ Aday haberleri topla
           ├─ Aynı olayları kümele
           ├─ AI ile sentezle (başlık, özet, gövde, kategori)
           ├─ Görsel bul (kaynak → Unsplash yedek)
           └─ Kaydet (yerel: data/articles.json  |  Vercel: Blob)
           │
           ▼
    ┌──────────────┐
    │  Next.js UI  │  ← ISR ile periyodik yenileme
    └──────────────┘
```

Site **istek anında yazmaz**; tüm üretim ingest aşamasında olur. Sayfalar okuma sırasında depodan haberleri çeker.

---

## Teknoloji

| Katman | Kullanılan |
|--------|------------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Stil | [Tailwind CSS v4](https://tailwindcss.com/) |
| UI | Ein UI glass bileşenleri + Lucide ikonlar |
| AI | Groq (varsayılan), Gemini (yedek) |
| Veri (yerel) | `data/articles.json` |
| Veri (production) | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Hızlı başlangıç

### Gereksinimler

- **Node.js** 20+
- **npm** 10+
- Ücretsiz [Groq API](https://console.groq.com/) anahtarı (zorunlu)
- İsteğe bağlı: [Unsplash API](https://unsplash.com/developers) anahtarı

### Kurulum

```bash
git clone https://github.com/farukkaygisiz24/CoreHUB.git
cd CoreHUB
npm install
cp .env.example .env.local
```

`.env.local` dosyasını aç ve en azından `GROQ_API_KEY` değerini doldur.

```bash
npm run ingest    # Haberleri üret → data/articles.json
npm run dev       # http://localhost:3000
```

İlk ingest birkaç dakika sürebilir; tamamlandığında ana sayfada haberler görünür.

---

## Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `GROQ_API_KEY` | Evet | Groq API anahtarı |
| `AI_CHAIN` | Hayır | Virgülle ayrılmış model zinciri. Örnek: `groq:llama-3.3-70b-versatile,groq:llama-3.1-8b-instant` |
| `UNSPLASH_ACCESS_KEY` | Hayır | Kaynak görseli yoksa Unsplash yedek |
| `CRON_SECRET` | Production | Cron endpoint koruması; rastgele uzun string |
| `BLOB_READ_WRITE_TOKEN` | Production | Vercel Blob token (depolama) |
| `INGEST_MAX_PER_RUN` | Hayır | Tek çalışmada max haber (varsayılan **6**) |

Şablon için: [`.env.example`](.env.example)

---

## Yerel geliştirme

| Komut | Ne yapar |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run ingest` | RSS → AI → görsel → `data/articles.json` |
| `npm run build` | Production build |
| `npm run start` | Production sunucusu |
| `npm run lint` | ESLint |

Ingest her çalıştığında yalnızca **yeni** haberleri ekler (URL hash ile tekrar engellenir). Mevcut haberler korunur.

Geliştiriciler / AI agent'lar için detaylı mimari: [`agents/PROJECT.md`](agents/PROJECT.md)

---

## Vercel'e deploy

CoreHUB, Vercel üzerinde sunucusuz ortamda çalışacak şekilde yapılandırılmıştır. Dosya sistemi production'da kalıcı değildir; haberler **Vercel Blob**'da tutulur.

### Adımlar

1. Repoyu GitHub'a push et.
2. [Vercel Dashboard](https://vercel.com/new) → **Import Git Repository** → projeyi seç.
3. **Storage → Blob** oluştur. `BLOB_READ_WRITE_TOKEN` otomatik eklenir.
4. **Settings → Environment Variables** bölümüne şunları ekle:

   ```
   GROQ_API_KEY=...
   AI_CHAIN=groq:llama-3.3-70b-versatile,groq:llama-3.1-8b-instant
   CRON_SECRET=<rastgele-uzun-string>
   INGEST_MAX_PER_RUN=6
   UNSPLASH_ACCESS_KEY=...   (opsiyonel)
   ```

5. **Deploy** et.

### Otomatik güncelleme (Cron)

[`vercel.json`](vercel.json) dosyası **10 dakikada bir** `/api/cron/ingest` endpoint'ini tetikler (run başına en fazla 6 haber). Vercel, `CRON_SECRET` tanımlıysa isteğe `Authorization: Bearer …` header'ı ekler.

Manuel test:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://senin-domain.vercel.app/api/cron/ingest
```

Başarılı yanıt örneği:

```json
{ "ok": true, "added": 2, "total": 46, "log": ["..."] }
```

### Vercel plan notları

| Plan | Cron sıklığı | Öneri |
|------|--------------|-------|
| **Hobby** | Günde en fazla ~1 kez (10 dk schedule çalışmaz) | [cron-job.org](https://cron-job.org) ile **10 dk** ping + `INGEST_MAX_PER_RUN=6` |
| **Pro** | 10 dakikada bir (`*/10 * * * *`) | `maxDuration=300` ile run başına 6 haber |

---

## Kaynak ve kategori ekleme

### Yeni RSS kaynağı

`lib/sources/feeds.ts` içindeki `FEEDS` dizisine bir satır ekle:

```ts
{ name: "Kaynak Adı", url: "https://example.com/rss.xml", category: "teknoloji" },
```

`category` alanı yalnızca ipucu/yedek; asıl kategori AI tarafından içeriğe göre seçilir. Sonraki ingest otomatik alır.

### Yeni kategori

`lib/types.ts` → `CATEGORIES` dizisine slug + label ekle. Tip sistemi otomatik güncellenir.

Mevcut kategoriler: **Gündem, Dünya, Ekonomi & Finans, Teknoloji, Yapay Zeka, Spor, Bilim, Sağlık, Otomobil**

---

## Proje yapısı

```
CoreHUB/
├── app/                    # Next.js sayfaları
│   ├── page.tsx            # Ana sayfa
│   ├── [category]/         # Kategori listeleri
│   ├── haber/[id]/         # Haber detayı
│   └── api/cron/ingest/    # Zamanlanmış ingest endpoint'i
├── components/             # UI bileşenleri
├── lib/
│   ├── ai/                 # LLM sağlayıcıları
│   ├── sources/            # RSS, kümeleme, tam metin
│   ├── images/             # Kaynak + Unsplash görselleri
│   ├── ingest/run.ts       # Ingest çekirdeği
│   └── store.ts            # Veri okuma/yazma
├── scripts/ingest.ts       # CLI ingest giriş noktası
├── data/articles.json      # Yerel haber deposu (seed)
└── agents/PROJECT.md       # Geliştirici / agent rehberi
```

---

## Önemli notlar

### İçerik ve telif
- Haber metinleri yapay zeka tarafından **özgün** üretilir; kaynak metin birebir kopyalanmaz.
- Her haberde orijinal kaynak linki zorunludur.
- Kaynak görselleri hotlink ile kullanılır; telif ve link kırılması riski vardır — production kullanımında kendi sorumluluğundadır.

### Yapay zeka sınırları
- Modeller bazen hata yapabilir; “Kaynak Doğrulama” skoru mutlak doğruluk garantisi değil, **kaç kaynağın aynı olayı doğruladığı** ölçüsüdür.
- Kesin rakam, tarih veya alıntı için her zaman kaynak linklerine başvurulmalıdır.

### Maliyet
- Groq ücretsiz katman + Vercel Hobby ile neredeyse sıfır maliyetle başlanabilir.
- Trafik ve ingest sıklığı arttıkça Pro plan veya ek API kotası gerekebilir.

---

## Katkıda bulunma

1. Fork et
2. Feature branch aç (`git checkout -b ozellik/harika-sey`)
3. Commit et (`git commit -m 'Yeni özellik: …'`)
4. Push et (`git push origin ozellik/harika-sey`)
5. Pull Request aç

Hata bildirimi, kaynak önerisi ve UI iyileştirmeleri memnuniyetle karşılanır. Büyük mimari değişiklikler için önce bir issue açman önerilir.

---

## Lisans

Bu depo açık kaynak olarak paylaşılmaktadır. Lisans dosyası (`LICENSE`) eklendiğinde burada güncellenecektir.

---

<p align="center">
  <strong>CoreHUB</strong> — Otomatik · Tarafsız · Açık Kaynak
</p>
