"use client";

import { useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/data";

const METRICS: { key: keyof Player; label: string; higherBetter: boolean }[] = [
  { key: "goals", label: "Goals", higherBetter: true },
  { key: "assists", label: "Assists", higherBetter: true },
  { key: "xg", label: "Expected Goals (xG)", higherBetter: true },
  { key: "shots", label: "Shots", higherBetter: true },
  { key: "passes_completed", label: "Passes Completed", higherBetter: true },
  { key: "pass_pct", label: "Pass Accuracy %", higherBetter: true },
  { key: "matches", label: "Matches Played", higherBetter: true },
];

function PlayerPicker({
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
      className="card px-3 py-2 w-full bg-transparent outline-none focus:border-accent"
    >
      <option value="">{placeholder}</option>
      {players.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} — {p.team}
        </option>
      ))}
    </select>
  );
}

export function CompareTool({ players }: { players: Player[] }) {
  const [aId, setAId] = useState<number | null>(null);
  const [bId, setBId] = useState<number | null>(null);

  const a = players.find((p) => p.id === aId) ?? null;
  const b = players.find((p) => p.id === bId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <PlayerPicker players={players} value={aId} onChange={setAId} placeholder="Select player A…" />
        <PlayerPicker players={players} value={bId} onChange={setBId} placeholder="Select player B…" />
      </div>

      {a && b ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-3 items-center px-4 py-3 border-b border-border">
            <Link href={`/players/${a.id}`} className="font-semibold hover:text-accent">
              {a.name}
              <span className="block text-xs text-muted font-normal">{a.team}</span>
            </Link>
            <span className="text-center text-xs uppercase tracking-wide text-muted">vs</span>
            <Link href={`/players/${b.id}`} className="font-semibold text-right hover:text-accent">
              {b.name}
              <span className="block text-xs text-muted font-normal">{b.team}</span>
            </Link>
          </div>

          {METRICS.map((m) => {
            const av = (a[m.key] as number) ?? 0;
            const bv = (b[m.key] as number) ?? 0;
            const max = Math.max(av, bv, 1);
            const aWins = av > bv;
            const bWins = bv > av;
            const fmt = (v: number) =>
              m.key === "xg" ? v.toFixed(2) : m.key === "pass_pct" ? `${v}%` : v;
            return (
              <div key={m.key} className="px-4 py-3 border-b border-border last:border-0">
                <div className="grid grid-cols-3 items-center gap-2 text-sm">
                  <span className={`stat-num text-right ${aWins ? "text-accent font-bold" : ""}`}>
                    {fmt(av)}
                  </span>
                  <span className="text-center text-xs text-muted">{m.label}</span>
                  <span className={`stat-num ${bWins ? "text-accent font-bold" : ""}`}>
                    {fmt(bv)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <div className="flex justify-end">
                    <div
                      className="h-1.5 rounded-full bg-accent/70"
                      style={{ width: `${(av / max) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-start">
                    <div
                      className="h-1.5 rounded-full bg-accent/40"
                      style={{ width: `${(bv / max) * 100}%` }}
                    />
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
