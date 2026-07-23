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

export type ClubRecord = {
  played: number; w: number; d: number; l: number; gf: number; ga: number; points: number;
};

export type Standing = {
  team: string; id: number; p: number; w: number; d: number; l: number;
  gf: number; ga: number; gd: number; pts: number;
};

export type CompetitionMeta = {
  slug: string;
  competition_name: string;
  season_name: string;
  type: "tournament" | "club" | "league";
  club: string | null;
  record: ClubRecord | null;
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

export type Team = {
  id: number; name: string;
  possession: number; passes: number; passes_completed: number; pass_pct: number | null;
  shots: number; xg: number; goals: number;
  tackles: number; interceptions: number; pressures: number; ppda: number | null;
  setpiece_shots: number; setpiece_goals: number; aerials_won: number;
};

export type Player = {
  id: number; name: string; team: string; team_id: number | null;
  matches: number; minutes: number; position: string | null; group: string;
  // attacking
  goals: number; np_goals: number; assists: number; shots: number; sot: number;
  xg: number; npxg: number;
  // passing
  passes: number; passes_completed: number; pass_pct: number | null;
  key_passes: number; prog_passes: number; passes_final_third: number;
  passes_into_box: number; crosses: number; through_balls: number; long_balls: number;
  // carrying / dribbling
  carries: number; prog_carries: number; carry_distance: number;
  dribbles: number; dribbles_completed: number;
  // defending
  tackles: number; tackles_won: number; interceptions: number; blocks: number;
  clearances: number; ball_recoveries: number; pressures: number;
  aerials_won: number; aerials_lost: number;
  // discipline / misc
  fouls: number; fouls_won: number; dispossessed: number;
  yellow_cards: number; red_cards: number;
  // goalkeeping
  gk_saves: number; gk_conceded: number;
  // derived
  per90: Record<string, number>;
  percentiles?: Record<string, number>;
  qualified: boolean;
};

export type Stadium = { name: string; match_count: number; match_ids: number[] };

export type Shot = {
  player: string; team: string; minute: number | null;
  x: number | null; y: number | null; xg: number | null;
  outcome: string | null; body_part: string | null;
};

export type NetNode = { id: number; name: string; x: number; y: number; passes: number };
export type NetEdge = { from: number; to: number; weight: number };
export type PassNetwork = { nodes: NetNode[]; edges: NetEdge[] };
export type MatchDetail = {
  match_id: number;
  shots: Shot[];
  networks: Record<string, PassNetwork>;
};

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
export const getStandings = cache((slug: string): Standing[] => {
  try {
    return readJson<Standing[]>(...inComp(slug, "standings.json"));
  } catch {
    return [];
  }
});

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
