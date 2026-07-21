import Link from "next/link";
import { getMeta, getMatches, getPlayers, getTeams, topPlayersBy } from "@/lib/data";
import { Leaderboard, StatTile } from "@/components/ui";

export default function Home() {
  const meta = getMeta();
  const matches = getMatches();
  const players = getPlayers();
  const teams = getTeams();

  const scorers = topPlayersBy("goals", 8);
  const xg = topPlayersBy("xg", 8);
  const passers = topPlayersBy("passes_completed", 8);

  return (
    <div className="space-y-10">
      <section className="text-center py-8">
        <p className="text-accent font-semibold uppercase tracking-wide text-sm">
          {meta.competition_name} {meta.season_name}
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mt-2 max-w-3xl mx-auto">
          Every match, player, and moment — in full statistical detail.
        </h1>
        <p className="text-muted mt-4 max-w-xl mx-auto">
          Shot maps, expected goals, and pass-by-pass data for the whole tournament.
          The kind of depth analysts pay for — free and browsable.
        </p>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Matches" value={matches.length} href="/matches" />
        <StatTile label="Teams" value={teams.length} href="/teams" />
        <StatTile label="Players" value={players.length} href="/players" />
        <StatTile label="Goals" value={players.reduce((s, p) => s + p.goals, 0)} />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Leaderboard
          title="Top Scorers"
          rows={scorers.map((p) => ({
            id: p.id,
            name: p.name,
            sub: p.team,
            value: p.goals,
            href: `/players/${p.id}`,
          }))}
        />
        <Leaderboard
          title="Expected Goals (xG)"
          rows={xg.map((p) => ({
            id: p.id,
            name: p.name,
            sub: p.team,
            value: p.xg.toFixed(1),
            href: `/players/${p.id}`,
          }))}
        />
        <Leaderboard
          title="Most Passes Completed"
          rows={passers.map((p) => ({
            id: p.id,
            name: p.name,
            sub: p.team,
            value: p.passes_completed,
            href: `/players/${p.id}`,
          }))}
        />
      </section>

      <section className="card p-6 text-center">
        <h2 className="text-xl font-semibold">Compare any two players, side by side</h2>
        <p className="text-muted mt-1">
          The tool pundits reach for — goals, xG, passing, and more, head to head.
        </p>
        <Link
          href="/compare"
          className="inline-block mt-4 px-5 py-2 rounded-md bg-accent text-accent-fg font-medium hover:opacity-90 transition-opacity"
        >
          Open the comparison tool
        </Link>
      </section>
    </div>
  );
}
