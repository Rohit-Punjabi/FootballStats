"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import type { Player } from "@/lib/data";
import { TeamBadge } from "@/components/TeamBadge";

const METRICS: { key: keyof Player; label: string }[] = [
  { key: "goals", label: "Goals" },
  { key: "assists", label: "Assists" },
  { key: "xg", label: "Expected Goals (xG)" },
  { key: "shots", label: "Shots" },
  { key: "passes_completed", label: "Passes Completed" },
  { key: "pass_pct", label: "Pass Accuracy %" },
  { key: "matches", label: "Matches Played" },
];

function Picker({
  players,
  value,
  onChange,
  placeholder,
}: {
  players: Player[];
  value: number | null;
  onChange: (id: number | null) => void;
  placeholder: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
      className="card px-4 py-2.5 w-full outline-none focus:border-primary"
      style={{
        borderRadius: "var(--radius-input)",
        backgroundColor: "var(--card)",
        color: "var(--fg)",
      }}
    >
      <option value="" style={{ backgroundColor: "var(--card)", color: "var(--fg)" }}>
        {placeholder}
      </option>
      {players.map((p) => (
        <option
          key={p.id}
          value={p.id}
          style={{ backgroundColor: "var(--card)", color: "var(--fg)" }}
        >
          {p.name} ({p.team})
        </option>
      ))}
    </select>
  );
}

export function CompareTool({ players, slug }: { players: Player[]; slug: string }) {
  const [aId, setAId] = useState<number | null>(null);
  const [bId, setBId] = useState<number | null>(null);

  const a = players.find((p) => p.id === aId) ?? null;
  const b = players.find((p) => p.id === bId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <Picker players={players} value={aId} onChange={setAId} placeholder="Select player A…" />
        <Picker players={players} value={bId} onChange={setBId} placeholder="Select player B…" />
      </div>

      {a && b ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-3 items-center px-6 py-4 border-b border-border">
            <Link href={`/${slug}/players/${a.id}` as Route} className="font-semibold hover:text-link flex items-center gap-2">
              <TeamBadge team={a.team} size="sm" />
              <span className="min-w-0">
                <span className="block truncate">{a.name}</span>
                <span className="block text-xs text-muted font-normal">{a.team}</span>
              </span>
            </Link>
            <span className="text-center text-xs uppercase tracking-wide text-muted">vs</span>
            <Link
              href={`/${slug}/players/${b.id}` as Route}
              className="font-semibold hover:text-link flex items-center gap-2 justify-end text-right"
            >
              <span className="min-w-0">
                <span className="block truncate">{b.name}</span>
                <span className="block text-xs text-muted font-normal">{b.team}</span>
              </span>
              <TeamBadge team={b.team} size="sm" />
            </Link>
          </div>

          {METRICS.map((m) => {
            const av = (a[m.key] as number) ?? 0;
            const bv = (b[m.key] as number) ?? 0;
            const max = Math.max(av, bv, 1);
            const fmt = (v: number) =>
              m.key === "xg" ? v.toFixed(2) : m.key === "pass_pct" ? `${v}%` : v;
            return (
              <div key={m.key} className="px-6 py-3.5 border-b border-border last:border-0">
                <div className="grid grid-cols-3 items-center gap-2 text-sm">
                  <span className={`stat-num text-right ${av > bv ? "text-link font-bold" : ""}`}>
                    {fmt(av)}
                  </span>
                  <span className="text-center text-xs text-muted">{m.label}</span>
                  <span className={`stat-num ${bv > av ? "text-link font-bold" : ""}`}>
                    {fmt(bv)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex justify-end">
                    <div className="h-1.5 rounded-full bg-primary/70" style={{ width: `${(av / max) * 100}%` }} />
                  </div>
                  <div className="flex justify-start">
                    <div className="h-1.5 rounded-full bg-secondary/60" style={{ width: `${(bv / max) * 100}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-muted text-sm">Choose two players above to compare them.</p>
      )}
    </div>
  );
}
