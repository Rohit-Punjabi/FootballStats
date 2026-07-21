"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/data";

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

export function PlayerTable({ players }: { players: Player[] }) {
  const [sort, setSort] = useState<keyof Player>("goals");
  const [asc, setAsc] = useState(false);
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const filtered = q
      ? players.filter(
          (p) =>
            p.name.toLowerCase().includes(q.toLowerCase()) ||
            p.team.toLowerCase().includes(q.toLowerCase()),
        )
      : players;
    return [...filtered].sort((a, b) => {
      const av = a[sort] ?? -Infinity;
      const bv = b[sort] ?? -Infinity;
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }, [players, sort, asc, q]);

  function toggle(key: keyof Player) {
    if (key === sort) setAsc(!asc);
    else {
      setSort(key);
      setAsc(false);
    }
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search player or team…"
        className="card px-3 py-2 mb-3 w-full sm:w-72 bg-transparent outline-none focus:border-accent"
      />
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggle(c.key)}
                  className={`px-3 py-2 cursor-pointer select-none hover:text-accent ${
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
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background">
                <td className="px-3 py-2">
                  <Link href={`/players/${p.id}`} className="hover:text-accent font-medium">
                    {p.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-muted">{p.team}</td>
                <td className="px-3 py-2 text-right stat-num">{p.matches}</td>
                <td className="px-3 py-2 text-right stat-num font-semibold">{p.goals}</td>
                <td className="px-3 py-2 text-right stat-num">{p.assists}</td>
                <td className="px-3 py-2 text-right stat-num">{p.xg.toFixed(1)}</td>
                <td className="px-3 py-2 text-right stat-num">{p.shots}</td>
                <td className="px-3 py-2 text-right stat-num">{p.passes_completed}</td>
                <td className="px-3 py-2 text-right stat-num">
                  {p.pass_pct != null ? `${p.pass_pct}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
