"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { GlassSwitch } from "@/components/ui/glass-switch";
import { cn } from "@/lib/utils";
import { applyTheme, resolveTheme, type Theme } from "@/lib/theme";

function subscribeTheme(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("corehub-theme-change", onStoreChange);
  return () => {
    mq.removeEventListener("change", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("corehub-theme-change", onStoreChange);
  };
}

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeTheme, resolveTheme, () => "dark" as Theme);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  function onCheckedChange(checked: boolean) {
    applyTheme(checked ? "dark" : "light");
  }

  return (
    <div className={cn("flex shrink-0 items-center", compact ? "gap-0" : "gap-2")}>
      {!compact && (
        <Sun className="h-3.5 w-3.5 text-slate-700 dark:text-white/50" aria-hidden />
      )}
      <GlassSwitch
        checked={mounted ? theme === "dark" : true}
        onCheckedChange={onCheckedChange}
        aria-label={theme === "dark" ? "Açık temaya geç" : "Koyu temaya geç"}
      />
      {!compact && (
        <Moon className="h-3.5 w-3.5 text-slate-700 dark:text-white/50" aria-hidden />
      )}
    </div>
  );
}
