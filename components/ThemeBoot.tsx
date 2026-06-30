"use client";

import { useEffect } from "react";
import { resolveTheme, setThemeColorMeta } from "@/lib/theme";

/** SSR sonrası tek theme-color meta'sını senkronize eder (Safari medya sorgulu çiftleri ezer). */
export default function ThemeBoot() {
  useEffect(() => {
    setThemeColorMeta(resolveTheme());
  }, []);
  return null;
}
