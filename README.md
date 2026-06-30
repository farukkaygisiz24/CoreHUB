# CoreHUB

Otomatik Türkçe haber derlemesi — RSS kaynakları, AI sentez, Vercel'de yayın.

## Yerel geliştirme

```bash
cp .env.example .env.local   # anahtarları doldur
npm install
npm run ingest               # data/articles.json güncellenir
npm run dev
```

## Vercel deploy

1. **GitHub:** repoyu `farukkaygisiz24/CoreHUB` olarak push et.
2. [vercel.com](https://vercel.com) → Import Git Repository → CoreHUB.
3. **Storage → Blob** oluştur (Read/Write token otomatik eklenir).
4. **Environment Variables** (Production + Preview):

   | Değişken | Açıklama |
   |----------|----------|
   | `GROQ_API_KEY` | Groq API |
   | `AI_CHAIN` | `groq:llama-3.3-70b-versatile,groq:llama-3.1-8b-instant` |
   | `UNSPLASH_ACCESS_KEY` | Görsel yedek (opsiyonel) |
   | `CRON_SECRET` | Rastgele uzun string — cron koruması |
   | `BLOB_READ_WRITE_TOKEN` | Blob storage (Vercel otomatik verebilir) |
   | `INGEST_MAX_PER_RUN` | `3` (serverless süre sınırı için) |

5. Deploy. Cron `vercel.json` ile **6 saatte bir** `/api/cron/ingest` çalıştırır.

### Cron'u manuel test

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://SENIN-DOMAIN.vercel.app/api/cron/ingest
```

### Plan notu

- **Hobby:** Cron en fazla günde 1 kez — daha sık ingest için Pro veya harici cron (cron-job.org) ile yukarıdaki URL'yi saatlik ping'le.
- **Pro:** `maxDuration=300` ile run başına ~3 haber güvenli; `INGEST_MAX_PER_RUN` ile ayarla.

Detaylı mimari: [`agents/PROJECT.md`](agents/PROJECT.md).
