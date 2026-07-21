import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayers, getPlayer, competitionSlugs } from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().flatMap((competition) =>
    getPlayers(competition).map((p) => ({ competition, id: String(p.id) })),
  );
}

export default async function PlayerPage({ params }: PageProps<"/[competition]/players/[id]">) {
  const { competition, id } = await params;
  const player = getPlayer(competition, Number(id));
  if (!player) notFound();

  return (
    <div>
      <Link href={`/${competition}/players`} className="text-sm text-primary hover:underline">
        ← All players
      </Link>

      {/* Hero */}
      <div className="mt-4 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 grid place-items-center text-2xl font-bold text-primary shrink-0">
          {player.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
        </div>
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">{player.name}</h1>
          <p className="text-muted">
            {player.team_id ? (
              <Link href={`/${competition}/teams/${player.team_id}`} className="hover:text-primary">
                {player.team}
              </Link>
            ) : (
              player.team
            )}{" "}
            · {player.matches} matches
          </p>
        </div>
      </div>

      {/* Key stats — the story at a glance */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <MetricCard value={player.goals} label="Goals" />
        <MetricCard value={player.assists} label="Assists" accent="secondary" />
        <MetricCard value={player.xg.toFixed(2)} label="Expected Goals" accent="muted" />
        <MetricCard
          value={(player.goals - player.xg).toFixed(2)}
          label="Goals − xG"
          accent="muted"
          sub="finishing vs. chance quality"
        />
      </div>

      {/* Secondary stats */}
      <Section title="Passing & shooting">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard value={player.shots} label="Shots" accent="muted" />
          <MetricCard value={player.passes} label="Passes" accent="muted" />
          <MetricCard value={player.passes_completed} label="Completed" accent="muted" />
          <MetricCard
            value={player.pass_pct != null ? `${player.pass_pct}%` : "—"}
            label="Pass Accuracy"
            accent="muted"
          />
        </div>
        <p className="text-sm text-muted mt-4">
          <span className="font-medium text-fg">Goals − xG</span> shows finishing vs. chance
          quality: positive means the player scored more than an average finisher would from the
          same chances.
        </p>
      </Section>
    </div>
  );
}
