"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { GlassSwitch } from "@/components/ui/glass-switch";

type Theme = "light" | "dark";

const THEME_CHANGE = "corehub-theme-change";

function getTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event(THEME_CHANGE));
}

function subscribeTheme(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(THEME_CHANGE, onStoreChange);
  return () => {
    mq.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(THEME_CHANGE, onStoreChange);
  };
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => "dark" as Theme);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function onCheckedChange(checked: boolean) {
    applyTheme(checked ? "dark" : "light");
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
