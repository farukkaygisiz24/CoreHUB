import { notFound } from "next/navigation";
import { getByCategory } from "@/lib/store";
import { CATEGORIES, type Category } from "@/lib/types";
import ArticleCard from "@/components/ArticleCard";
import { GlassCard } from "@/components/ui/glass-card";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORIES.find((c) => c.slug === category);
  if (!meta) notFound();

  const articles = await getByCategory(category as Category);

  return (
    <div className="space-y-6">
      <GlassCard glowEffect={false} className="px-6 py-4">
        <h1 className="text-2xl font-extrabold glass-text">
          <span className="bg-linear-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
            {meta.label}
          </span>
        </h1>
      </GlassCard>

      {articles.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <p className="text-sm glass-text-muted">
            Bu kategoride henüz haber yok. Otomatik derleme sürdükçe burası dolacak.
          </p>
        </GlassCard>
      ) : (
        <div className="grid auto-rows-fr items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      )}
    </div>
  );
}
