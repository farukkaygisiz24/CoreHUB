import Link from "next/link";
import { getLatestArticles, loadArticles } from "@/lib/store";
import { CATEGORIES } from "@/lib/types";
import { fetchTrendingTopics } from "@/lib/sources/trends";
import { getPopularArticles } from "@/lib/ranking/popular";
import ArticleCard from "@/components/ArticleCard";
import PopularHero from "@/components/PopularHero";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";

export const revalidate = 300;

function SectionTitle({ label }: { label: string }) {
  return (
    <h2 className="text-lg font-bold glass-text">
      <span className="bg-linear-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
        {label}
      </span>
    </h2>
  );
}

export default async function Home() {
  const [articles, trends] = await Promise.all([
    loadArticles(),
    fetchTrendingTopics(10),
  ]);

  if (articles.length === 0) {
    return (
      <GlassCard className="p-10 text-center">
        <h1 className="mb-2 text-xl font-bold glass-text">Haberler hazırlanıyor…</h1>
        <p className="text-sm glass-text-muted">
          İçerikler otomatik derleniyor. İlk derleme için{" "}
          <code className="rounded-lg bg-black/5 px-2 py-0.5 dark:bg-white/10">
            npm run ingest
          </code>{" "}
          komutunu çalıştırın.
        </p>
      </GlassCard>
    );
  }

  const popular = getPopularArticles(articles, trends, 10);
  const popularIds = new Set(popular.map((a) => a.id));
  const latest = getLatestArticles(articles, 6, popularIds);

  const sections = CATEGORIES.map((c) => ({
    ...c,
    items: articles.filter((a) => a.category === c.slug).slice(0, 3),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="space-y-12">
      <PopularHero articles={popular} />

      {latest.length > 0 && (
        <section>
          <SectionTitle label="Son Haberler" />
          <div className="mt-4 grid auto-rows-fr items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {sections.map((s) => (
        <section key={s.slug}>
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle label={s.label} />
            <GlassButton variant="ghost" size="sm" asChild>
              <Link href={`/${s.slug}`}>Tümü →</Link>
            </GlassButton>
          </div>
          <div className="grid auto-rows-fr items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {s.items.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
