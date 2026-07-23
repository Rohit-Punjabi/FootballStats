import Link from "next/link";
import type { Route } from "next";
import type { Standing } from "@/lib/data";
import { TeamBadge } from "@/components/TeamBadge";

/** Full league table with the champion highlighted. */
export function StandingsTable({ standings, slug }: { standings: Standing[]; slug: string }) {
  const cols: { key: keyof Standing; label: string; title: string }[] = [
    { key: "p", label: "P", title: "Played" },
    { key: "w", label: "W", title: "Won" },
    { key: "d", label: "D", title: "Drawn" },
    { key: "l", label: "L", title: "Lost" },
    { key: "gf", label: "GF", title: "Goals for" },
    { key: "ga", label: "GA", title: "Goals against" },
    { key: "gd", label: "GD", title: "Goal difference" },
  ];
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted text-[13px]">
            <th className="px-3 py-3 text-right font-medium w-8">#</th>
            <th className="px-3 py-3 text-left font-medium">Team</th>
            {cols.map((c) => (
              <th key={c.key} title={c.title} className="px-2 py-3 text-right font-medium w-10">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-3 text-right font-medium w-12">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => (
            <tr
              key={s.id}
              className={`border-b border-border last:border-0 hover:bg-bg ${
                i === 0 ? "bg-primary/5" : ""
              }`}
            >
              <td className="px-3 py-2 text-right stat-num text-muted">
                <span className={i === 0 ? "text-accent" : ""}>{i + 1}</span>
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/${slug}/teams/${s.id}` as Route}
                  className="flex items-center gap-2 hover:text-link font-medium"
                >
                  <TeamBadge team={s.team} size="sm" />
                  <span className="truncate">{s.team}</span>
                  {i === 0 && <span aria-hidden title="Champions">🏆</span>}
                </Link>
              </td>
              {cols.map((c) => (
                <td key={c.key} className="px-2 py-2 text-right stat-num text-muted">
                  {c.key === "gd" && s.gd > 0 ? `+${s.gd}` : s[c.key]}
                </td>
              ))}
              <td className="px-3 py-2 text-right stat-num font-bold">{s.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
