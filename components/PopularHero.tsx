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
  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
  "border border-black/10 bg-black/5 text-slate-700 backdrop-blur-xl",
  "shadow-sm transition hover:scale-105 hover:bg-black/10 active:scale-95",
  "dark:border-white/30 dark:bg-white/15 dark:text-white dark:hover:bg-white/25",
);

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
  const style = categoryStyle(current.category);

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
        <div className="flex items-center gap-2 sm:gap-3">
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
            <Link href={`/haber/${current.id}`} className="group block">
              <GlassCard glowEffect className="overflow-hidden p-0">
                <div className="relative">
                  <div className="relative aspect-[16/10] w-full sm:aspect-[21/9]">
                    {current.imageUrl ? (
                      <ArticleImage
                        key={current.id}
                        src={current.imageUrl}
                        alt={current.title}
                        fill
                        priority={index === 0}
                        className="transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className={`h-full w-full bg-linear-to-br ${style.gradient}`} />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/35 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <GlassBadge variant="primary" className={style.solid}>
                        {labelFor(current.category)}
                      </GlassBadge>
                    </div>
                    <h3 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                      {current.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-white/75 sm:text-base">
                      {current.summary}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </Link>
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
          <div className="flex gap-2 sm:gap-3">
            <div className="w-10 shrink-0" aria-hidden />
            <div
              ref={thumbContainerRef}
              className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-none pb-1"
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
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border transition",
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
            <div className="w-10 shrink-0" aria-hidden />
          </div>
        )}
      </div>
    </section>
  );
}
