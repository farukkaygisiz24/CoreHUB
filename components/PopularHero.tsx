"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Article } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";
import { categoryStyle } from "@/lib/ui/categoryStyle";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassBadge } from "@/components/ui/glass-badge";
import ArticleImage from "@/components/ArticleImage";
import { cn } from "@/lib/utils";

const labelFor = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

const AUTOPLAY_MS = 7000;

const navBtnClass = cn(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10",
  "border border-black/10 bg-black/5 text-slate-700 backdrop-blur-xl",
  "shadow-sm transition hover:scale-105 hover:bg-black/10 active:scale-95",
  "dark:border-white/30 dark:bg-white/15 dark:text-white dark:hover:bg-white/25",
);

const overlayNavClass = cn(
  navBtnClass,
  "absolute top-1/2 z-20 -translate-y-1/2",
  "border-white/25 bg-black/45 text-white hover:bg-black/60",
  "dark:border-white/20 dark:bg-black/50",
);

function HeroSlide({
  article,
  priority,
}: {
  article: Article;
  priority?: boolean;
}) {
  const style = categoryStyle(article.category);

  return (
    <Link href={`/haber/${article.id}`} className="group block">
      <GlassCard glowEffect className="overflow-hidden p-0">
        <div className="relative">
          <div className="relative aspect-[4/5] w-full sm:aspect-[16/10] md:aspect-[21/9]">
            {article.imageUrl ? (
              <ArticleImage
                src={article.imageUrl}
                alt={article.title}
                fill
                priority={priority}
                className="transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className={`h-full w-full bg-linear-to-br ${style.gradient}`} />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/45 to-black/10" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8">
            <GlassBadge size="sm" className={cn("border-0 shadow-sm", style.solid)}>
              {labelFor(article.category)}
            </GlassBadge>
            <h3 className="mt-2.5 text-[1.35rem] font-extrabold leading-[1.25] tracking-tight text-white sm:mt-3 sm:text-2xl sm:leading-tight md:text-4xl">
              {article.title}
            </h3>
            <p className="mt-2 line-clamp-3 text-[0.9375rem] leading-snug text-white/85 sm:line-clamp-2 sm:text-base sm:text-white/75">
              {article.summary}
            </p>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}

export default function PopularHero({ articles }: { articles: Article[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const thumbContainerRef = useRef<HTMLDivElement>(null);
  const count = articles.length;

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % count);
  }, [count]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(goNext, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, goNext, paused]);

  useEffect(() => {
    const container = thumbContainerRef.current;
    const thumb = thumbRefs.current[index];
    if (!container || !thumb) return;

    const left =
      thumb.offsetLeft - container.clientWidth / 2 + thumb.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [index]);

  if (count === 0) return null;

  const current = articles[index]!;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold glass-text">
          <span className="bg-linear-to-r from-cyan-500 to-purple-500 bg-clip-text text-transparent">
            Gündemi Meşgul Eden
          </span>
        </h2>
        {count > 1 && (
          <span className="text-xs glass-text-muted">
            {index + 1} / {count}
          </span>
        )}
      </div>

      <div
        className="space-y-3"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Mobil: tam genişlik kart + oklar görsel üstünde */}
        <div className="relative md:hidden">
          <HeroSlide article={current} priority={index === 0} />
          {count > 1 && (
            <>
              <button
                type="button"
                className={cn(overlayNavClass, "left-2")}
                onClick={(e) => {
                  e.preventDefault();
                  goPrev();
                }}
                aria-label="Önceki haber"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                className={cn(overlayNavClass, "right-2")}
                onClick={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                aria-label="Sonraki haber"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Masaüstü: yan oklar */}
        <div className="hidden items-center gap-3 md:flex">
          {count > 1 && (
            <button
              type="button"
              className={navBtnClass}
              onClick={goPrev}
              aria-label="Önceki haber"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <HeroSlide article={current} priority={index === 0} />
          </div>

          {count > 1 && (
            <button
              type="button"
              className={navBtnClass}
              onClick={goNext}
              aria-label="Sonraki haber"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        {count > 1 && (
          <div
            ref={thumbContainerRef}
            className="flex gap-2 overflow-x-auto scrollbar-none pb-1 md:mx-[3.25rem]"
            role="tablist"
            aria-label="Manşet haberleri"
          >
            {articles.map((a, i) => (
              <button
                key={a.id}
                ref={(el) => {
                  thumbRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onFocus={() => setIndex(i)}
                onClick={() => setIndex(i)}
                aria-label={`${a.title} — ${i + 1}. haber`}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition sm:h-[4.5rem] sm:w-28",
                  i === index
                    ? "border-cyan-400/60 opacity-100 ring-2 ring-cyan-400/30"
                    : "border-white/10 opacity-70 hover:border-cyan-400/40 hover:opacity-100 dark:border-white/20",
                )}
              >
                {a.imageUrl ? (
                  <ArticleImage src={a.imageUrl} alt="" fill className="object-cover" />
                ) : (
                  <div
                    className={`h-full w-full bg-linear-to-br ${categoryStyle(a.category).gradient}`}
                  />
                )}
                <div className="absolute inset-0 bg-black/30" />
                <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
