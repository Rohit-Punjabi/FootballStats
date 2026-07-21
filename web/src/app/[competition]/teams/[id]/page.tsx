import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTeams,
  getTeam,
  getTeamPlayers,
  getTeamMatches,
  competitionSlugs,
} from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().flatMap((competition) =>
    getTeams(competition).map((t) => ({ competition, id: String(t.id) })),
  );
}

export default async function TeamPage({ params }: PageProps<"/[competition]/teams/[id]">) {
  const { competition, id } = await params;
  const team = getTeam(competition, Number(id));
  if (!team) notFound();

  const players = getTeamPlayers(competition, team.id);
  const matches = getTeamMatches(competition, team.name);
  const goals = players.reduce((s, p) => s + p.goals, 0);
  const xg = players.reduce((s, p) => s + p.xg, 0);

  return (
    <div>
      <Link href={`/${competition}/teams`} className="text-sm text-primary hover:underline">
        ← All teams
      </Link>
      <h1 className="text-[32px] leading-tight font-bold tracking-tight mt-4">{team.name}</h1>
      <p className="text-muted mt-1">{matches.length} matches at the tournament</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <MetricCard value={goals} label="Goals" />
        <MetricCard value={xg.toFixed(1)} label="Expected Goals" accent="secondary" />
        <MetricCard value={players.length} label="Players Used" accent="muted" />
        <MetricCard value={matches.length} label="Matches" accent="muted" />
      </div>

      <Section title="Results">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/${competition}/matches/${m.id}`}
              className="card card-hover px-5 py-3 flex items-center gap-3 text-sm"
            >
              <span className="flex-1 text-right truncate">{m.home_team}</span>
              <span className="stat-num font-bold">
                {m.home_score}-{m.away_score}
              </span>
              <span className="flex-1 truncate">{m.away_team}</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Squad">
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-left">
                <th className="px-4 py-3 font-medium">Player</th>
                <th className="px-4 py-3 text-right font-medium">G</th>
                <th className="px-4 py-3 text-right font-medium">A</th>
                <th className="px-4 py-3 text-right font-medium">xG</th>
                <th className="px-4 py-3 text-right font-medium">Pass%</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-b border-border last:border-0 hover:bg-bg ${i % 2 ? "bg-bg/40" : ""}`}
                >
                  <td className="px-4 py-2.5">
                    <Link href={`/${competition}/players/${p.id}`} className="hover:text-primary font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right stat-num font-semibold">{p.goals}</td>
                  <td className="px-4 py-2.5 text-right stat-num">{p.assists}</td>
                  <td className="px-4 py-2.5 text-right stat-num">{p.xg.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right stat-num">
                    {p.pass_pct != null ? `${p.pass_pct}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
