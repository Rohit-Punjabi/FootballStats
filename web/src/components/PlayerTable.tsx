"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Player } from "@/lib/data";
import { TeamBadge } from "@/components/TeamBadge";

type Col = { key: keyof Player; label: string; numeric: boolean };

const COLS: Col[] = [
  { key: "name", label: "Player", numeric: false },
  { key: "team", label: "Team", numeric: false },
  { key: "matches", label: "MP", numeric: true },
  { key: "goals", label: "G", numeric: true },
  { key: "assists", label: "A", numeric: true },
  { key: "xg", label: "xG", numeric: true },
  { key: "shots", label: "Sh", numeric: true },
  { key: "passes_completed", label: "Pass", numeric: true },
  { key: "pass_pct", label: "Pass%", numeric: true },
];

const PAGE_SIZE = 25;

export function PlayerTable({ players, slug }: { players: Player[]; slug: string }) {
  const [sort, setSort] = useState<keyof Player>("goals");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const rows = q
      ? players.filter(
          (p) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.team.toLowerCase().includes(q.toLowerCase()),
        )
      : players;
    return [...rows].sort((a, b) => {
      const av = a[sort] ?? -Infinity;
      const bv = b[sort] ?? -Infinity;
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }, [players, sort, asc, q]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

  function toggle(key: keyof Player) {
    if (key === sort) setAsc(!asc);
    else {
      setSort(key);
      setAsc(false);
    }
    setPage(0);
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setPage(0);
        }}
        placeholder="Search player or team…"
        className="card px-4 py-2.5 mb-4 w-full sm:w-80 bg-transparent outline-none focus:border-primary rounded-input"
        style={{ borderRadius: "var(--radius-input)" }}
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggle(c.key)}
                  className={`px-4 py-3 cursor-pointer select-none hover:text-link font-medium ${
                    c.numeric ? "text-right" : "text-left"
                  }`}
                >
                  {c.label}
                  {sort === c.key && (asc ? " ▲" : " ▼")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.id}
                className={`border-b border-border last:border-0 hover:bg-bg ${
                  i % 2 ? "bg-bg/40" : ""
                }`}
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/${slug}/players/${p.id}` as Route}
                    className="hover:text-link font-medium"
                  >
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-muted">
                  <span className="flex items-center gap-2">
                    <TeamBadge team={p.team} size="sm" />
                    <span className="truncate">{p.team}</span>
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right stat-num">{p.matches}</td>
                <td className="px-4 py-2.5 text-right stat-num font-semibold">{p.goals}</td>
                <td className="px-4 py-2.5 text-right stat-num">{p.assists}</td>
                <td className="px-4 py-2.5 text-right stat-num">{p.xg.toFixed(1)}</td>
                <td className="px-4 py-2.5 text-right stat-num">{p.shots}</td>
                <td className="px-4 py-2.5 text-right stat-num">{p.passes_completed}</td>
                <td className="px-4 py-2.5 text-right stat-num">
                  {p.pass_pct != null ? `${p.pass_pct}%` : "n/a"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — keeps the page light even with thousands of players */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted">
        <span>
          {filtered.length.toLocaleString()} players
          {q && ` matching “${q}”`}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={clampedPage === 0}
            className="px-4 min-h-[40px] rounded-lg border border-border disabled:opacity-40 hover:border-link transition-colors"
          >
            Prev
          </button>
          <span className="stat-num">
            {clampedPage + 1} / {pageCount}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={clampedPage >= pageCount - 1}
            className="px-4 min-h-[40px] rounded-lg border border-border disabled:opacity-40 hover:border-link transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
