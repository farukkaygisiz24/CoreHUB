"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { CATEGORIES } from "@/lib/types";
import ThemeToggle from "@/components/ThemeToggle";
import { GlassCard } from "@/components/ui/glass-card";
import { GlassButton } from "@/components/ui/glass-button";
import { cn } from "@/lib/utils";

function CategoryMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = CATEGORIES.find((c) => pathname === `/${c.slug}`);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function openMenu() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), 160);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const isActive = Boolean(active || open);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <GlassButton
        type="button"
        variant={isActive ? "default" : "ghost"}
        size="sm"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="header-bar-text-muted gap-1.5 text-xs"
      >
        {active ? active.label : "Kategoriler"}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </GlassButton>

      {open && (
        <div className="absolute left-0 top-full z-[100] min-w-[13rem] pt-2">
          <div
            role="menu"
            className={cn(
              "rounded-xl border p-1.5 shadow-xl backdrop-blur-xl",
              "border-white/60 bg-white/80",
              "dark:border-white/20 dark:bg-neutral-900/80",
            )}
          >
            <ul className="flex flex-col gap-0.5">
              {CATEGORIES.map((c) => (
                <li key={c.slug} role="none">
                  <Link
                    href={`/${c.slug}`}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium transition",
                      pathname === `/${c.slug}`
                        ? "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300"
                        : "text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10",
                    )}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function NavHomeLink({ pathname }: { pathname: string }) {
  const active = pathname === "/";
  return (
    <GlassButton
      variant={active ? "default" : "ghost"}
      size="sm"
      className="header-bar-text-muted text-xs"
      asChild
    >
      <Link href="/">Ana Sayfa</Link>
    </GlassButton>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const now = new Date();
  const today = now.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const mobileDate = now.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-50 px-4 pt-3">
      <GlassCard
        glowEffect={false}
        fillHeight={false}
        className="header-bar mx-auto max-w-5xl overflow-visible rounded-2xl px-3 py-3 backdrop-blur-2xl sm:px-4"
      >
        {/* Mobil */}
        <div className="flex flex-col gap-2.5 md:hidden">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <Link href="/" className="group flex min-w-0 items-center gap-2 overflow-hidden">
              <span className="block h-7 w-1 shrink-0 rounded-full bg-linear-to-b from-cyan-500 to-purple-600" />
              <span className="truncate text-base font-black uppercase tracking-tight header-bar-text">
                Core
                <span className="bg-linear-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-purple-500">
                  HUB
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 items-center gap-1.5">
              <time
                dateTime={now.toISOString().slice(0, 10)}
                suppressHydrationWarning
                className="whitespace-nowrap text-[10px] leading-none header-bar-text-muted"
              >
                {mobileDate}
              </time>
              <ThemeToggle />
            </div>
          </div>
          <nav aria-label="Site navigasyonu" className="flex items-center justify-center gap-2">
            <NavHomeLink pathname={pathname} />
            <CategoryMenu key={pathname} />
          </nav>
        </div>

        {/* Masaüstü */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
          <Link href="/" className="group flex items-center gap-2 justify-self-start">
            <span className="block h-7 w-1 rounded-full bg-linear-to-b from-cyan-500 to-purple-600 transition group-hover:from-cyan-400 group-hover:to-purple-500" />
            <span className="text-xl font-black uppercase tracking-tight header-bar-text">
              Core
              <span className="bg-linear-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent dark:from-cyan-400 dark:to-purple-500">
                HUB
              </span>
            </span>
          </Link>

          <nav aria-label="Site navigasyonu" className="flex items-center justify-center gap-2">
            <NavHomeLink pathname={pathname} />
            <CategoryMenu key={pathname} />
          </nav>

          <div className="flex items-center justify-end gap-3 justify-self-end">
            <time
              dateTime={now.toISOString().slice(0, 10)}
              suppressHydrationWarning
              className="text-xs header-bar-text-muted"
            >
              {today}
            </time>
            <ThemeToggle />
          </div>
        </div>
      </GlassCard>
    </header>
  );
}
