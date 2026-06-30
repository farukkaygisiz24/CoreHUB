import type { Category } from "@/lib/types";

// Her kategoriye canlı bir renk kimliği. Tailwind'in statik sınıfları derlemeye
// dahil edebilmesi için TAM sınıf adları yazılır (dinamik `bg-${x}` çalışmaz).
export interface CategoryStyle {
  badge: string; // küçük etiket (açık zemin + koyu yazı)
  solid: string; // dolu renkli rozet (renkli zemin + beyaz yazı)
  bar: string; // bölüm başlığı çizgisi
  gradient: string; // manşet/dekoratif gradyan
  text: string; // vurgulu metin rengi
}

export const CATEGORY_STYLE: Record<Category, CategoryStyle> = {
  gundem: { badge: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300", solid: "bg-red-600 text-white", bar: "bg-red-500", gradient: "from-red-500 to-orange-500", text: "text-red-600 dark:text-red-400" },
  dunya: { badge: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300", solid: "bg-sky-600 text-white", bar: "bg-sky-500", gradient: "from-sky-500 to-blue-600", text: "text-sky-600 dark:text-sky-400" },
  ekonomi: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300", solid: "bg-emerald-600 text-white", bar: "bg-emerald-500", gradient: "from-emerald-500 to-teal-600", text: "text-emerald-600 dark:text-emerald-400" },
  teknoloji: { badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300", solid: "bg-indigo-600 text-white", bar: "bg-indigo-500", gradient: "from-indigo-500 to-blue-600", text: "text-indigo-600 dark:text-indigo-400" },
  "yapay-zeka": { badge: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300", solid: "bg-violet-600 text-white", bar: "bg-violet-500", gradient: "from-violet-500 to-fuchsia-600", text: "text-violet-600 dark:text-violet-400" },
  spor: { badge: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300", solid: "bg-orange-600 text-white", bar: "bg-orange-500", gradient: "from-orange-500 to-amber-500", text: "text-orange-600 dark:text-orange-400" },
  bilim: { badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300", solid: "bg-cyan-600 text-white", bar: "bg-cyan-500", gradient: "from-cyan-500 to-sky-600", text: "text-cyan-600 dark:text-cyan-400" },
  saglik: { badge: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300", solid: "bg-teal-600 text-white", bar: "bg-teal-500", gradient: "from-teal-500 to-emerald-600", text: "text-teal-600 dark:text-teal-400" },
  otomobil: { badge: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300", solid: "bg-amber-600 text-white", bar: "bg-amber-500", gradient: "from-amber-500 to-yellow-500", text: "text-amber-700 dark:text-amber-400" },
};

export function categoryStyle(slug: Category): CategoryStyle {
  return CATEGORY_STYLE[slug] ?? CATEGORY_STYLE.gundem;
}
