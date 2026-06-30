import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { THEME_COLORS } from "@/lib/theme";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CoreHUB — Tarafsız Haber Derlemesi",
  description:
    "Teknoloji, yapay zeka, Türkiye gündemi ve spor haberlerinin otomatik, tarafsız derlemesi.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
  ],
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);var c=d?'${THEME_COLORS.dark}':'${THEME_COLORS.light}';var m=document.querySelector('meta[name="theme-color"]');if(m)m.content=c;else{var e=document.createElement('meta');e.name='theme-color';e.content=c;document.head.appendChild(e);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="tr"
      className={cn("h-full antialiased", "font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="app-shell relative min-h-screen flex flex-col">
        <div className="app-bg" aria-hidden>
          <div className="app-bg-base" />
          <div className="app-bg-orb app-bg-orb-cyan" />
          <div className="app-bg-orb app-bg-orb-purple" />
          <div className="app-bg-orb app-bg-orb-indigo" />
        </div>
        <SiteHeader />
        <main className="relative mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
