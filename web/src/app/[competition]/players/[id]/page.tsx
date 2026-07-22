import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayers, getPlayer, competitionSlugs, type Player } from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";
import { TeamBadge } from "@/components/TeamBadge";
import { StatBlock, type StatRow } from "@/components/StatBlock";
import { RadarChart } from "@/components/RadarChart";

export function generateStaticParams() {
  return competitionSlugs().flatMap((competition) =>
    getPlayers(competition).map((p) => ({ competition, id: String(p.id) })),
  );
}

const GROUP_LABEL: Record<string, string> = {
  GK: "goalkeepers",
  DEF: "defenders",
  MID: "midfielders",
  FWD: "forwards",
};

// Radar axes — must match pipeline RADAR keys/order.
const RADAR: { label: string; key: string }[] = [
  { label: "Non-pen goals", key: "np_goals" },
  { label: "npxG", key: "npxg" },
  { label: "Shots", key: "shots" },
  { label: "Key passes", key: "key_passes" },
  { label: "Prog. passes", key: "prog_passes" },
  { label: "Pass %", key: "pass_pct" },
  { label: "Prog. carries", key: "prog_carries" },
  { label: "Dribbles", key: "dribbles_completed" },
  { label: "Tackles + Int", key: "tackles_interceptions" },
  { label: "Recoveries", key: "ball_recoveries" },
];

const p90 = (p: Player, k: string) => p.per90?.[k] ?? null;

export default async function PlayerPage({ params }: PageProps<"/[competition]/players/[id]">) {
  const { competition, id } = await params;
  const p = getPlayer(competition, Number(id));
  if (!p) notFound();

  const isGK = p.group === "GK" || p.gk_saves > 0;

  const attacking: StatRow[] = [
    { label: "Goals", value: p.goals },
    { label: "Non-penalty goals", value: p.np_goals, per90: p90(p, "np_goals") },
    { label: "Assists", value: p.assists, per90: p90(p, "assists") },
    { label: "Shots", value: p.shots, per90: p90(p, "shots") },
    { label: "Shots on target", value: p.sot },
    { label: "xG", value: p.xg.toFixed(2) },
    { label: "Non-penalty xG", value: p.npxg.toFixed(2), per90: p90(p, "npxg") },
  ];
  const passing: StatRow[] = [
    { label: "Passes completed", value: p.passes_completed },
    { label: "Pass accuracy", value: p.pass_pct != null ? `${p.pass_pct}%` : "n/a" },
    { label: "Key passes", value: p.key_passes, per90: p90(p, "key_passes") },
    { label: "Progressive passes", value: p.prog_passes, per90: p90(p, "prog_passes") },
    { label: "Into final third", value: p.passes_final_third, per90: p90(p, "passes_final_third") },
    { label: "Into penalty box", value: p.passes_into_box, per90: p90(p, "passes_into_box") },
    { label: "Crosses", value: p.crosses },
    { label: "Through balls", value: p.through_balls },
    { label: "Long balls", value: p.long_balls },
  ];
  const carrying: StatRow[] = [
    { label: "Carries", value: p.carries },
    { label: "Progressive carries", value: p.prog_carries, per90: p90(p, "prog_carries") },
    { label: "Distance carried (m)", value: p.carry_distance.toLocaleString() },
    { label: "Dribbles completed", value: p.dribbles_completed, per90: p90(p, "dribbles_completed") },
    { label: "Dribbles attempted", value: p.dribbles },
  ];
  const defending: StatRow[] = [
    { label: "Tackles (won)", value: `${p.tackles} (${p.tackles_won})`, per90: p90(p, "tackles") },
    { label: "Interceptions", value: p.interceptions, per90: p90(p, "interceptions") },
    { label: "Blocks", value: p.blocks },
    { label: "Clearances", value: p.clearances },
    { label: "Ball recoveries", value: p.ball_recoveries, per90: p90(p, "ball_recoveries") },
    { label: "Pressures", value: p.pressures, per90: p90(p, "pressures") },
    { label: "Aerials won", value: p.aerials_won, per90: p90(p, "aerials_won") },
  ];
  const discipline: StatRow[] = [
    { label: "Fouls committed", value: p.fouls },
    { label: "Fouls won", value: p.fouls_won },
    { label: "Dispossessed", value: p.dispossessed },
    { label: "Yellow cards", value: p.yellow_cards },
    { label: "Red cards", value: p.red_cards },
  ];
  const goalkeeping: StatRow[] = [
    { label: "Saves", value: p.gk_saves },
    { label: "Goals conceded", value: p.gk_conceded },
    {
      label: "Save %",
      value:
        p.gk_saves + p.gk_conceded > 0
          ? `${Math.round((100 * p.gk_saves) / (p.gk_saves + p.gk_conceded))}%`
          : "n/a",
    },
  ];

  const radarData = p.percentiles
    ? RADAR.map((r) => ({ label: r.label, percentile: p.percentiles![r.key] ?? 0 }))
    : [];

  return (
    <div>
      <Link href={`/${competition}/players`} className="text-sm text-link hover:underline">
        Back to all players
      </Link>

      {/* Hero */}
      <div className="mt-4 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center text-2xl font-bold text-link shrink-0">
          {p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">{p.name}</h1>
          <p className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
            <TeamBadge team={p.team} size="sm" />
            {p.team_id ? (
              <Link href={`/${competition}/teams/${p.team_id}`} className="hover:text-link">
                {p.team}
              </Link>
            ) : (
              p.team
            )}
            {p.position && <span className="text-faint">· {p.position}</span>}
            <span className="text-faint">· {p.matches} matches · {p.minutes} min</span>
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <MetricCard value={p.goals} label="Goals" icon="⚽" />
        <MetricCard value={p.assists} label="Assists" accent="secondary" icon="🅰️" />
        <MetricCard value={p.xg.toFixed(2)} label="Expected Goals" accent="muted" icon="📊" />
        <MetricCard value={p.npxg.toFixed(2)} label="Non-pen xG" accent="muted" icon="🎯" />
      </div>

      {/* Percentile radar */}
      {p.qualified && radarData.length > 0 && (
        <Section title="Percentile profile">
          <div className="card p-6 grid md:grid-cols-[380px_1fr] gap-6 items-center">
            <RadarChart data={radarData} />
            <div className="text-sm text-muted">
              <p>
                Each axis is {p.name.split(" ").slice(-1)[0]}&apos;s <span className="text-fg font-medium">percentile
                rank</span> among {GROUP_LABEL[p.group] ?? "players"} at this tournament (per 90
                minutes, min. 180 mins). Further out = better.
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-4">
                {radarData.map((r) => (
                  <div key={r.label} className="flex justify-between border-b border-border py-1">
                    <span>{r.label}</span>
                    <span className="stat-num font-semibold text-link">{r.percentile}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* Deep stat categories */}
      <Section title="Full stats">
        <div className="grid md:grid-cols-2 gap-5">
          <StatBlock title="⚽ Attacking" rows={attacking} />
          <StatBlock title="🎯 Passing" rows={passing} />
          <StatBlock title="🏃 Carrying & dribbling" rows={carrying} />
          <StatBlock title="🛡️ Defending" rows={defending} />
          <StatBlock title="🟨 Discipline" rows={discipline} />
          {isGK && <StatBlock title="🧤 Goalkeeping" rows={goalkeeping} />}
        </div>
      </Section>
    </div>
  );
}
