import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { getMeta } from "@/lib/data";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FootballStats — World Cup, in full detail",
  description:
    "Every match, player, team and stadium from the World Cup — shot maps, xG, and deep stats. Built on StatsBomb open data.",
};

const NAV = [
  { href: "/matches", label: "Matches" },
  { href: "/players", label: "Players" },
  { href: "/teams", label: "Teams" },
  { href: "/stadiums", label: "Stadiums" },
  { href: "/compare", label: "Compare" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let subtitle = "World Cup";
  try {
    const meta = getMeta();
    subtitle = `${meta.competition_name} ${meta.season_name}`;
  } catch {
    // data not generated yet — fall back to a generic label
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-border sticky top-0 z-10 bg-background/85 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-6">
            <Link href="/" className="font-bold tracking-tight flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />
              FootballStats
              <span className="text-muted font-normal text-sm hidden sm:inline">
                {subtitle}
              </span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-1.5 rounded-md hover:bg-card hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-8">{children}</main>

        <footer className="border-t border-border text-sm text-muted">
          <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row gap-2 justify-between">
            <p>A portfolio project — non-commercial.</p>
            <p>
              Data ©{" "}
              <a
                href="https://github.com/statsbomb/open-data"
                className="text-accent hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                StatsBomb Open Data
              </a>
              , used under their free user agreement.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
