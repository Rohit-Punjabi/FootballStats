/**
 * Data access layer — the ONE place the app reads data.
 *
 * Today it reads the per-competition JSON the Python pipeline writes under
 * `data/competitions/<slug>/`. Because every read goes through this module, the
 * storage can later be swapped for a database or API without touching any page:
 * keep these function signatures, change only their bodies.
 *
 * Server Components / SSG only — uses `fs`. Never import into a Client Component.
 */
import { cache } from "react";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "..", "data");

function readJson<T>(...segments: string[]): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, ...segments), "utf-8")) as T;
}

// --- Types ------------------------------------------------------------------

export type CompetitionMeta = {
  slug: string;
  competition_name: string;
  season_name: string;
  match_count: number;
  team_count: number;
  player_count: number;
  goal_count: number;
  champion: string | null;
  final_match_id: number | null;
  top_scorer: { id: number; name: string; team: string; goals: number } | null;
};

export type Match = {
  id: number; date: string | null; kickoff: string | null; stage: string | null;
  home_team: string; away_team: string;
  home_score: number | null; away_score: number | null;
  stadium: string | null; referee: string | null; attendance: number | null;
};

export type Team = { id: number; name: string };

export type Player = {
  id: number; name: string; team: string; team_id: number | null;
  matches: number; goals: number; assists: number; shots: number; xg: number;
  passes: number; passes_completed: number; pass_pct: number | null;
};

export type Stadium = { name: string; match_count: number; match_ids: number[] };

export type Shot = {
  player: string; team: string; minute: number | null;
  x: number | null; y: number | null; xg: number | null;
  outcome: string | null; body_part: string | null;
};

export type MatchDetail = { match_id: number; shots: Shot[] };

// --- Competition index ------------------------------------------------------

export const getCompetitions = cache((): CompetitionMeta[] =>
  readJson<CompetitionMeta[]>("competitions.json"),
);

export const getCompetition = cache((slug: string): CompetitionMeta | undefined =>
  getCompetitions().find((c) => c.slug === slug),
);

export const competitionSlugs = cache((): string[] =>
  getCompetitions().map((c) => c.slug),
);

// --- Per-competition entity loaders -----------------------------------------

const inComp = (slug: string, file: string) => ["competitions", slug, file];

export const getMatches = cache((slug: string): Match[] =>
  readJson<Match[]>(...inComp(slug, "matches.json")),
);
export const getTeams = cache((slug: string): Team[] =>
  readJson<Team[]>(...inComp(slug, "teams.json")),
);
export const getPlayers = cache((slug: string): Player[] =>
  readJson<Player[]>(...inComp(slug, "players.json")),
);
export const getStadiums = cache((slug: string): Stadium[] =>
  readJson<Stadium[]>(...inComp(slug, "stadiums.json")),
);

export const getMatch = cache((slug: string, id: number): Match | undefined =>
  getMatches(slug).find((m) => m.id === id),
);
export const getPlayer = cache((slug: string, id: number): Player | undefined =>
  getPlayers(slug).find((p) => p.id === id),
);
export const getTeam = cache((slug: string, id: number): Team | undefined =>
  getTeams(slug).find((t) => t.id === id),
);
export const getStadium = cache((slug: string, name: string): Stadium | undefined =>
  getStadiums(slug).find((s) => s.name === name),
);

export const getMatchDetail = cache((slug: string, id: number): MatchDetail | null => {
  try {
    return readJson<MatchDetail>("competitions", slug, "matches", `${id}.json`);
  } catch {
    return null;
  }
});

// --- Derived helpers --------------------------------------------------------

export const getTeamPlayers = cache((slug: string, teamId: number): Player[] =>
  getPlayers(slug)
    .filter((p) => p.team_id === teamId)
    .sort((a, b) => b.goals - a.goals || b.xg - a.xg),
);

export const getTeamMatches = cache((slug: string, teamName: string): Match[] =>
  getMatches(slug).filter((m) => m.home_team === teamName || m.away_team === teamName),
);

export function topPlayersBy(slug: string, stat: keyof Player, n = 10): Player[] {
  return [...getPlayers(slug)]
    .filter((p) => typeof p[stat] === "number")
    .sort((a, b) => (b[stat] as number) - (a[stat] as number))
    .slice(0, n);
}

export const stadiumSlug = (name: string) =>
  encodeURIComponent(name.toLowerCase().replace(/\s+/g, "-"));

/** A short, human label for a competition, e.g. "World Cup 2022". */
export const competitionLabel = (c: CompetitionMeta) =>
  `${c.competition_name.replace(/^FIFA |^UEFA /, "")} ${c.season_name}`;
