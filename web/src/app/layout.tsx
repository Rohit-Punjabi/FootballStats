import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FootballStats — the story behind the numbers",
  description:
    "A calm, visual home for football statistics. Shot maps, xG, and deep stats for every match, player, team and stadium. Built on StatsBomb open data.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border/70">
          <div className="mx-auto max-w-[1200px] px-6 h-16 flex items-center">
            <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
              <span
                aria-hidden
                className="inline-grid place-items-center w-7 h-7 rounded-xl bg-primary text-primary-fg text-sm"
              >
                ⚽
              </span>
              FootballStats
            </Link>
          </div>
        </header>

        <div className="flex-1 w-full">{children}</div>

        <footer className="border-t border-border/70 text-sm text-muted mt-16">
          <div className="mx-auto max-w-[1200px] px-6 py-8 flex flex-col sm:flex-row gap-2 justify-between">
            <p>A portfolio project — non-commercial.</p>
            <p>
              Data ©{" "}
              <a
                href="https://github.com/statsbomb/open-data"
                className="text-primary hover:underline"
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
