"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

export function CompetitionNav({ slug, label }: { slug: string; label: string }) {
  const pathname = usePathname();
  const base = `/${slug}`;
  const items: { href: string; label: string }[] = [
    { href: base, label: "Overview" },
    { href: `${base}/matches`, label: "Matches" },
    { href: `${base}/players`, label: "Players" },
    { href: `${base}/teams`, label: "Teams" },
    { href: `${base}/stadiums`, label: "Stadiums" },
    { href: `${base}/compare`, label: "Compare" },
    { href: `${base}/stats`, label: "Stats" },
  ];

  return (
    <div className="border-b border-border/70 sticky top-0 z-10 bg-bg/85 backdrop-blur">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex items-center gap-1 h-14 overflow-x-auto text-sm">
          <span className="font-semibold mr-3 shrink-0">{label}</span>
          {items.map((item) => {
            const active =
              item.href === base ? pathname === base : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as Route}
                className={`px-4 min-h-[44px] inline-flex items-center rounded-lg whitespace-nowrap font-medium transition-colors ${
                  active
                    ? "bg-primary/15 text-link"
                    : "text-muted hover:text-fg hover:bg-card"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
