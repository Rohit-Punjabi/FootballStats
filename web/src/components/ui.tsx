import Link from "next/link";
import type { Route } from "next";

/** Page-content container: comfortable reading width, generous side margins. */
export function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1200px] px-6 ${className}`}>{children}</div>;
}

/** Section wrapper with a title and generous vertical rhythm. */
export function Section({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      {title && (
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-[32px] leading-tight font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-muted mt-1.5 text-lg">{subtitle}</p>}
    </div>
  );
}

/**
 * Metric card — number FIRST, label second (design principle: users scan
 * numbers). Optional sub line for context ("↑ +4 from last season").
 */
export function MetricCard({
  value,
  label,
  sub,
  icon,
  accent = "primary",
}: {
  value: React.ReactNode;
  label: string;
  sub?: string;
  icon?: string;
  accent?: "primary" | "secondary" | "accent" | "muted";
}) {
  const color = {
    primary: "text-link",
    secondary: "text-secondary",
    accent: "text-accent",
    muted: "text-fg",
  }[accent];
  return (
    <div className="card p-6 relative overflow-hidden">
      {icon && (
        <span aria-hidden className="absolute top-4 right-4 text-2xl opacity-90">
          {icon}
        </span>
      )}
      <div className={`text-[34px] leading-none font-bold stat-num ${color}`}>{value}</div>
      <div className="text-[13px] font-medium uppercase tracking-wide text-muted mt-2">{label}</div>
      {sub && <div className="text-sm text-muted mt-1">{sub}</div>}
    </div>
  );
}

/** Small labelled pill, e.g. "⚽ 8 Goals". */
export function StatChip({ children }: { children: React.ReactNode }) {
  return <span className="chip">{children}</span>;
}

/** Primary call-to-action link. */
export function ButtonLink({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-btn bg-link text-primary-fg font-medium hover:opacity-90 transition-opacity"
    >
      {children}
    </Link>
  );
}

/** Compact leaderboard card: rank · name (linked) · value. */
export function Leaderboard({
  title,
  rows,
}: {
  title: string;
  rows: { id: number; name: string; sub?: string; value: React.ReactNode; href: Route }[];
}) {
  return (
    <div className="card overflow-hidden">
      <h3 className="px-5 py-4 font-semibold border-b border-border text-sm uppercase tracking-wide text-muted">
        {title}
      </h3>
      <ol>
        {rows.map((r, i) => {
          const medal = ["🥇", "🥈", "🥉"][i];
          return (
            <li key={r.id} className="border-b border-border last:border-0">
              <Link
                href={r.href}
                className="flex items-center gap-3 px-5 py-2.5 hover:bg-bg transition-colors"
              >
                <span className="w-5 text-center text-sm">
                  {medal ?? <span className="text-muted stat-num">{i + 1}</span>}
                </span>
                <span className="flex-1 truncate">
                  {r.name}
                  {r.sub && <span className="text-muted text-sm ml-2">{r.sub}</span>}
                </span>
                <span className="stat-num font-semibold">{r.value}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
