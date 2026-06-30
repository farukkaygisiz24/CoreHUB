"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { GlassSwitch } from "@/components/ui/glass-switch";

type Theme = "light" | "dark";

function getTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(getTheme());
    setMounted(true);
  }, []);

  function onCheckedChange(checked: boolean) {
    const next: Theme = checked ? "dark" : "light";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-3.5 w-3.5 text-slate-700 dark:text-white/50" aria-hidden />
      <GlassSwitch
        checked={mounted ? theme === "dark" : true}
        onCheckedChange={onCheckedChange}
        aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      />
      <Moon className="h-3.5 w-3.5 text-slate-700 dark:text-white/50" aria-hidden />
    </div>
  );
}
