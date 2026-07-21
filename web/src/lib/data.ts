/**
 * Data access layer.
 *
 * The Python pipeline writes clean JSON into the repo-root `data/` folder.
 * These helpers read that JSON at build time (Server Components / SSG only —
 * they use `fs`, so never import them into a Client Component).
 *
 * Everything is wrapped in React's `cache()` so each file is read from disk at
 * most once per build, no matter how many pages ask for it.
 */
import { cache } from "react";
import fs from "node:fs";
import path from "node:path";

// web/ is one level below the repo root; data/ lives at the root.
const DATA_DIR = path.join(process.cwd(), "..", "data");

function readJson<T>(...segments: string[]): T {
  const file = path.join(DATA_DIR, ...segments);
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

// --- Types (mirror the pipeline output) -------------------------------------

export type Meta = {
  competition_name: string;
  season_name: string;
  match_count: number;
};

export type Match = {
  id: number;
  date: string | null;
  kickoff: string | null;
  stage: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  stadium: string | null;
  referee: string | null;
  attendance: number | null;
};

export type Team = { id: number; name: string };

export type Player = {
  id: number;
  name: string;
  team: string;
  team_id: number | null;
  matches: number;
  goals: number;
  assists: number;
  shots: number;
  xg: number;
  passes: number;
  passes_completed: number;
  pass_pct: number | null;
};

export type Stadium = { name: string; match_count: number; match_ids: number[] };

export type Shot = {
  player: string;
  team: string;
  minute: number | null;
  x: number | null;
  y: number | null;
  xg: number | null;
  outcome: string | null;
  body_part: string | null;
};

export type MatchDetail = { match_id: number; shots: Shot[] };

// --- Loaders ----------------------------------------------------------------

export const getMeta = cache((): Meta => readJson<Meta>("meta.json"));
export const getMatches = cache((): Match[] => readJson<Match[]>("matches.json"));
export const getTeams = cache((): Team[] => readJson<Team[]>("teams.json"));
export const getPlayers = cache((): Player[] => readJson<Player[]>("players.json"));
export const getStadiums = cache((): Stadium[] => readJson<Stadium[]>("stadiums.json"));

export const getMatch = cache((id: number): Match | undefined =>
  getMatches().find((m) => m.id === id),
);

export const getPlayer = cache((id: number): Player | undefined =>
  getPlayers().find((p) => p.id === id),
);

export const getTeam = cache((id: number): Team | undefined =>
  getTeams().find((t) => t.id === id),
);

export const getStadium = cache((name: string): Stadium | undefined =>
  getStadiums().find((s) => s.name === name),
);

export const getMatchDetail = cache((id: number): MatchDetail | null => {
  try {
    return readJson<MatchDetail>("matches", `${id}.json`);
  } catch {
    return null;
  }
});

// --- Derived helpers --------------------------------------------------------

/** Players belonging to a team, best (by goals then xG) first. */
export const getTeamPlayers = cache((teamId: number): Player[] =>
  getPlayers()
    .filter((p) => p.team_id === teamId)
    .sort((a, b) => b.goals - a.goals || b.xg - a.xg),
);

/** Matches involving a team, chronological. */
export const getTeamMatches = cache((teamName: string): Match[] =>
  getMatches().filter((m) => m.home_team === teamName || m.away_team === teamName),
);

/** Top N players by a numeric stat (e.g. "goals", "xg", "assists"). */
export function topPlayersBy(stat: keyof Player, n = 10): Player[] {
  return [...getPlayers()]
    .filter((p) => typeof p[stat] === "number")
    .sort((a, b) => (b[stat] as number) - (a[stat] as number))
    .slice(0, n);
}

/** Turn a stadium name into a URL-safe slug and back. */
export const stadiumSlug = (name: string) =>
  encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));
