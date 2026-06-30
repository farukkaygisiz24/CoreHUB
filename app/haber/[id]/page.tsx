import Link from "next/link";
import { notFound } from "next/navigation";
import { getById, loadArticles } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";
import { categoryStyle } from "@/lib/ui/categoryStyle";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import { GlassButton } from "@/components/ui/glass-button";
import CredibilityMeter from "@/components/CredibilityMeter";
import ArticleSources from "@/components/ArticleSources";
import SourcePerspectives from "@/components/SourcePerspectives";
import ArticleImage from "@/components/ArticleImage";

export const revalidate = 300;

export async function generateStaticParams() {
  const articles = await loadArticles();
  return articles.map((a) => ({ id: a.id }));
}

const labelFor = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getById(id);
  if (!article) notFound();

  const style = categoryStyle(article.category);
  const date = new Date(article.publishedAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const disclaimer =
    article.sources.length > 1
      ? `Bu içerik, aşağıdaki ${article.sources.length} kaynağın karşılaştırılmasıyla yapay zeka tarafından tarafsız biçimde derlenmiştir.`
      : "Bu içerik, aşağıdaki kaynaktan yola çıkılarak yapay zeka tarafından özgün olarak yazılmıştır.";

  const isUnsplashImage = article.imageLink?.includes("unsplash.com") ?? false;

  return (
    <article className="mx-auto max-w-5xl space-y-6">
      <GlassButton variant="ghost" size="sm" asChild>
        <Link href={`/${article.category}`}>← {labelFor(article.category)}</Link>
      </GlassButton>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <GlassCard glowEffect className="min-w-0 overflow-hidden">
          <GlassCardContent className="space-y-4 p-6 sm:p-8">
            <GlassBadge variant="primary" className={style.solid}>
              {labelFor(article.category)}
            </GlassBadge>

            <h1 className="text-3xl font-extrabold leading-tight glass-text sm:text-4xl">
              {article.title}
            </h1>

            <p className="text-sm glass-text-muted">{date}</p>

            {article.imageUrl && (
              <figure>
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
                  <ArticleImage
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
                {article.imageCredit && article.imageLink && (
                  <figcaption className="mt-2 text-xs glass-text-muted">
                    Görsel:{" "}
                    <a
                      href={article.imageLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-2 hover:underline"
                    >
                      {article.imageCredit}
                    </a>
                    {isUnsplashImage ? " / Unsplash" : " — kaynak haber"}
                  </figcaption>
                )}
              </figure>
            )}

            {article.youtubeId && (
              <figure>
                <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${article.youtubeId}`}
                    title={article.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full border-0"
                  />
                </div>
                <figcaption className="mt-2 text-xs glass-text-muted">
                  Video: YouTube üzerinden gömülmüştür
                </figcaption>
              </figure>
            )}

            {article.divergenceNote && (
              <GlassCard
                glowEffect={false}
                fillHeight={false}
                className="border-amber-400/30 bg-amber-500/10 p-4 dark:bg-amber-500/10"
              >
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                  ⚠ Kaynaklar arasında farklılık var
                </p>
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-200/80">
                  {article.divergenceNote}
                </p>
              </GlassCard>
            )}

            <div className="space-y-4 text-[17px] leading-relaxed glass-text">
              {article.body.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <SourcePerspectives perspectives={article.perspectives} />
          </GlassCardContent>
        </GlassCard>

        <aside className="lg:sticky lg:top-24">
          <GlassCard glowEffect={false}>
            <GlassCardContent className="space-y-4 p-5">
              <CredibilityMeter article={article} />
              <div className="h-px w-full bg-black/10 dark:bg-white/10" />
              <p className="text-sm leading-relaxed glass-text-muted">
                {disclaimer} Bilgiler genel niteliktedir; kesin veriler için kaynakları ve resmi
                açıklamaları kontrol edin.
              </p>
              <ArticleSources sources={article.sources} />
            </GlassCardContent>
          </GlassCard>
        </aside>
      </div>
    </article>
  );
}
