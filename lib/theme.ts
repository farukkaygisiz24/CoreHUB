export const THEME_COLORS = {
  light: "#f8fafc",
  dark: "#0f172a",
} as const;

export type Theme = "light" | "dark";

/** iOS Safari status bar + alt toolbar rengi */
export function setThemeColorMeta(theme: Theme) {
  if (typeof document === "undefined") return;
  const color = theme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", color);
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
  setThemeColorMeta(theme);
  window.dispatchEvent(new Event("corehub-theme-change"));
}

export function resolveTheme(): Theme {
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
