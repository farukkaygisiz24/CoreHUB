import Link from "next/link";
import type { Article } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { categoryStyle } from "@/lib/ui/categoryStyle";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import ArticleImage from "@/components/ArticleImage";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "az önce";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

const labelFor = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export default function ArticleCard({ article }: { article: Article }) {
  const style = categoryStyle(article.category);

  return (
    <Link href={`/haber/${article.id}`} className="group flex h-full">
      <GlassCard
        glowEffect={false}
        className="h-full overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] dark:hover:shadow-[0_12px_40px_rgba(59,130,246,0.25)]"
      >
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
          {article.imageUrl ? (
            <ArticleImage
              src={article.imageUrl}
              alt={article.title}
              fill
              className="transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className={`h-full w-full bg-linear-to-br ${style.gradient} opacity-90`} />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
          <GlassBadge
            variant="primary"
            size="sm"
            className={`absolute left-3 top-3 ${style.solid} border-0`}
          >
            {labelFor(article.category)}
          </GlassBadge>
        </div>

        <div className="flex min-h-0 flex-1 flex-col p-5">
          <h2 className="mb-2 line-clamp-2 text-lg font-bold leading-snug glass-text group-hover:text-cyan-600 dark:group-hover:text-cyan-300">
            {article.title}
          </h2>
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed glass-text-muted">
            {article.summary}
          </p>
          <div className="mt-auto flex flex-wrap items-center gap-2 text-xs glass-text-muted">
            <span>{timeAgo(article.publishedAt)}</span>
            {article.divergenceNote && (
              <GlassBadge variant="warning" size="sm">
                ⚠ ayrışıyor
              </GlassBadge>
            )}
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
