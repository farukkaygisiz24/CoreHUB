"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import type { ArticleSource } from "@/lib/types";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

export default function ArticleSources({ sources }: { sources: ArticleSource[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (sources.length === 0) return null;

  const fullWidthBtn = "[&>div]:block [&>div]:w-full";

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold glass-text">Kaynaklar</p>

      {sources.length === 1 ? (
        <div className={cn("w-full", fullWidthBtn)}>
          <GlassButton variant="primary" size="sm" className="w-full" asChild>
            <a href={sources[0]!.url} target="_blank" rel="noopener noreferrer">
              {sources[0]!.name} ↗
            </a>
          </GlassButton>
        </div>
      ) : (
        <div ref={ref} className="relative w-full">
          <div className={fullWidthBtn}>
            <GlassButton
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              aria-expanded={open}
              aria-haspopup="menu"
              onClick={() => setOpen((v) => !v)}
            >
              {sources.length} kaynak
              <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
            </GlassButton>
          </div>

          {open && (
            <div
              role="menu"
              className={cn(
                "absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border p-1 shadow-xl backdrop-blur-xl",
                "border-white/60 bg-white/90",
                "dark:border-white/20 dark:bg-neutral-900/90",
              )}
            >
              <ul className="flex flex-col gap-0.5">
                {sources.map((s) => (
                  <li key={s.url} role="none">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                        "text-slate-800 hover:bg-slate-100",
                        "dark:text-slate-200 dark:hover:bg-white/10",
                      )}
                    >
                      <span className="truncate">{s.name}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
