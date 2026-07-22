import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { ThemeToggle } from "@/components/ThemeToggle";

// Applies the saved theme before paint so there's no flash of the wrong theme.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const space = Space_Grotesk({ variable: "--font-space", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: "FootballStats: the story behind the numbers",
  description:
    "A bold, visual home for football stats. Shot maps, xG, and deep numbers for every match, player, team and stadium. Built on StatsBomb open data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${space.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <header className="border-b border-border/70 bg-surface/40 backdrop-blur">
          <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center gap-3">
            <Link
              href="/"
              className="font-bold text-lg tracking-tight flex items-center gap-2.5"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span
                aria-hidden
                className="inline-grid place-items-center w-8 h-8 rounded-xl text-base"
                style={{ background: "var(--grad-primary)", boxShadow: "0 4px 14px rgba(59,130,246,0.4)" }}
              >
                ⚽
              </span>
              FootballStats
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 w-full">{children}</div>

        <footer className="border-t border-border/70 text-sm text-muted mt-16">
          <div className="mx-auto max-w-[1200px] px-6 py-8 flex flex-col sm:flex-row gap-2 justify-between">
            <p>A little project made for the love of the game.</p>
            <p>
              Data ©{" "}
              <a
                href="https://github.com/statsbomb/open-data"
                className="text-link hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                StatsBomb Open Data
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
