import type { Article } from "@/lib/types";
import { getCredibility, type CredibilityLevel } from "@/lib/ranking/credibility";

const STYLE: Record<CredibilityLevel, { bar: string; text: string; dot: string }> = {
  high: {
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "🟢",
  },
  medium: {
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    dot: "🟡",
  },
  low: {
    bar: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    dot: "🔴",
  },
};

export default function CredibilityMeter({ article }: { article: Article }) {
  const c = getCredibility(article);
  const s = STYLE[c.level];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold glass-text">Kaynak Doğrulama</span>
        <span className={`font-bold ${s.text}`}>%{c.score}</span>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10"
        role="progressbar"
        aria-valuenow={c.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${c.score}%` }} />
      </div>

      <p className="text-xs glass-text-muted">
        {s.dot} {c.label}
      </p>
    </div>
  );
}
