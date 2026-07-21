import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayers, getPlayer } from "@/lib/data";
import { StatTile } from "@/components/ui";

export function generateStaticParams() {
  return getPlayers().map((p) => ({ id: String(p.id) }));
}

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const { id } = await params;
  const player = getPlayer(Number(id));
  if (!player) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/players" className="text-sm text-accent hover:underline">
          ← All players
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mt-2">{player.name}</h1>
        <p className="text-muted">
          {player.team_id ? (
            <Link href={`/teams/${player.team_id}`} className="hover:text-accent">
              {player.team}
            </Link>
          ) : (
            player.team
          )}{" "}
          · {player.matches} matches
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Goals" value={player.goals} />
        <StatTile label="Assists" value={player.assists} />
        <StatTile label="Expected Goals" value={player.xg.toFixed(2)} />
        <StatTile label="Shots" value={player.shots} />
        <StatTile label="Passes" value={player.passes} />
        <StatTile label="Completed" value={player.passes_completed} />
        <StatTile
          label="Pass Accuracy"
          value={player.pass_pct != null ? `${player.pass_pct}%` : "—"}
        />
        <StatTile
          label="Goals − xG"
          value={(player.goals - player.xg).toFixed(2)}
        />
      </div>

      <p className="text-sm text-muted">
        <span className="font-medium text-foreground">Goals − xG</span> shows finishing
        vs. chance quality: positive means the player scored more than an average finisher
        would from the same chances.
      </p>
    </div>
  );
}
