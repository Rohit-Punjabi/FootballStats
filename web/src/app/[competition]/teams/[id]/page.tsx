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
import { TeamBadge } from "@/components/TeamBadge";
import { StatBlock } from "@/components/StatBlock";

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

  const tactics = [
    { label: "Possession", value: `${team.possession}%` },
    { label: "Pass accuracy", value: team.pass_pct != null ? `${team.pass_pct}%` : "n/a" },
    { label: "Passes completed", value: team.passes_completed.toLocaleString() },
    { label: "Shots", value: team.shots },
    { label: "Expected goals (xG)", value: team.xg.toFixed(1) },
    { label: "PPDA (press intensity)", value: team.ppda ?? "n/a" },
    { label: "Tackles", value: team.tackles },
    { label: "Interceptions", value: team.interceptions },
    { label: "Pressures", value: team.pressures },
    { label: "Aerials won", value: team.aerials_won },
    { label: "Set piece goals", value: team.setpiece_goals },
  ];

  return (
    <div>
      <Link href={`/${competition}/teams`} className="text-sm text-link hover:underline">
        Back to all teams
      </Link>
      <div className="flex items-center gap-4 mt-4">
        <TeamBadge team={team.name} size="lg" />
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">{team.name}</h1>
          <p className="text-muted">{matches.length} matches at the tournament</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <MetricCard value={team.goals} label="Goals" icon="⚽" />
        <MetricCard value={team.xg.toFixed(1)} label="Expected Goals" accent="secondary" icon="📊" />
        <MetricCard value={`${team.possession}%`} label="Possession" accent="accent" icon="🕹️" />
        <MetricCard value={team.ppda ?? "n/a"} label="PPDA (press)" accent="muted" icon="🔥" />
      </div>

      <Section title="Style & tactics">
        <div className="grid md:grid-cols-2 gap-5">
          <StatBlock title="🎛️ Team profile" rows={tactics.slice(0, 6)} />
          <StatBlock title="🛡️ Pressing & duels" rows={tactics.slice(6)} />
        </div>
      </Section>

      <Section title="Results">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/${competition}/matches/${m.id}`}
              className="card card-hover px-5 py-3 flex items-center gap-2 text-sm"
            >
              <span className="flex-1 flex items-center justify-end gap-2 min-w-0">
                <span className="truncate">{m.home_team}</span>
                <TeamBadge team={m.home_team} size="sm" />
              </span>
              <span className="stat-num font-bold">
                {m.home_score}&nbsp;·&nbsp;{m.away_score}
              </span>
              <span className="flex-1 flex items-center gap-2 min-w-0">
                <TeamBadge team={m.away_team} size="sm" />
                <span className="truncate">{m.away_team}</span>
              </span>
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
                    <Link href={`/${competition}/players/${p.id}`} className="hover:text-link font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-right stat-num font-semibold">{p.goals}</td>
                  <td className="px-4 py-2.5 text-right stat-num">{p.assists}</td>
                  <td className="px-4 py-2.5 text-right stat-num">{p.xg.toFixed(1)}</td>
                  <td className="px-4 py-2.5 text-right stat-num">
                    {p.pass_pct != null ? `${p.pass_pct}%` : "n/a"}
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
