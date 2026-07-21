import Link from "next/link";
import type { Route } from "next";

/** Page title block used at the top of list/detail pages. */
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted mt-1">{subtitle}</p>}
    </div>
  );
}

/** A big number with a label — the building block of stat rows. */
export function StatTile({
  label,
  value,
  href,
}: {
  label: string;
  value: React.ReactNode;
  href?: Route;
}) {
  const inner = (
    <div className="card px-4 py-3 h-full">
      <div className="text-2xl font-bold stat-num">{value}</div>
      <div className="text-xs uppercase tracking-wide text-muted mt-0.5">{label}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:border-accent transition-colors [&>div]:hover:border-accent">
      {inner}
    </Link>
  ) : (
    inner
  );
}

/** A compact leaderboard card: rank, name (linked), and a stat value. */
export function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: { id: number; name: string; sub?: string; value: React.ReactNode; href: Route }[];
}) {
  return (
    <div className="card overflow-hidden">
      <h2 className="px-4 py-3 font-semibold border-b border-border text-sm uppercase tracking-wide">
        {title}
      </h2>
      <ol>
        {rows.map((r, i) => (
          <li key={r.id} className="border-b border-border last:border-0">
            <Link
              href={r.href}
              className="flex items-center gap-3 px-4 py-2 hover:bg-background transition-colors"
            >
              <span className="w-5 text-muted stat-num text-sm">{i + 1}</span>
              <span className="flex-1 truncate">
                {r.name}
                {r.sub && <span className="text-muted text-sm ml-2">{r.sub}</span>}
              </span>
              <span className="stat-num font-semibold">{r.value}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
