import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeams, getTeam, getTeamPlayers, getTeamMatches } from "@/lib/data";
import { PageHeader, StatTile } from "@/components/ui";

export function generateStaticParams() {
  return getTeams().map((t) => ({ id: String(t.id) }));
}

export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  const team = getTeam(Number(id));
  if (!team) notFound();

  const players = getTeamPlayers(team.id);
  const matches = getTeamMatches(team.name);
  const goals = players.reduce((s, p) => s + p.goals, 0);
  const xg = players.reduce((s, p) => s + p.xg, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teams" className="text-sm text-accent hover:underline">
          ← All teams
        </Link>
        <PageHeader title={team.name} subtitle={`${matches.length} matches at the tournament`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Goals" value={goals} />
        <StatTile label="Expected Goals" value={xg.toFixed(1)} />
        <StatTile label="Players Used" value={players.length} />
        <StatTile label="Matches" value={matches.length} />
      </div>

      <section>
        <h2 className="font-semibold mb-2">Results</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="card px-4 py-2 flex items-center gap-3 hover:border-accent transition-colors text-sm"
            >
              <span className="flex-1 text-right truncate">{m.home_team}</span>
              <span className="stat-num font-bold">
                {m.home_score}-{m.away_score}
              </span>
              <span className="flex-1 truncate">{m.away_team}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Squad</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-left">
                <th className="px-3 py-2">Player</th>
                <th className="px-3 py-2 text-right">G</th>
                <th className="px-3 py-2 text-right">A</th>
                <th className="px-3 py-2 text-right">xG</th>
                <th className="px-3 py-2 text-right">Pass%</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-background">
                  <td className="px-3 py-2">
                    <Link href={`/players/${p.id}`} className="hover:text-accent font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-right stat-num font-semibold">{p.goals}</td>
                  <td className="px-3 py-2 text-right stat-num">{p.assists}</td>
                  <td className="px-3 py-2 text-right stat-num">{p.xg.toFixed(1)}</td>
                  <td className="px-3 py-2 text-right stat-num">
                    {p.pass_pct != null ? `${p.pass_pct}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
