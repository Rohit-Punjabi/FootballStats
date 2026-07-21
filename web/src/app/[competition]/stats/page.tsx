import { notFound } from "next/navigation";
import { getCompetition, topPlayersBy, competitionSlugs } from "@/lib/data";
import { PageHeader, Leaderboard, ButtonLink } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function StatsPage({ params }: PageProps<"/[competition]/stats">) {
  const { competition } = await params;
  if (!getCompetition(competition)) notFound();

  const boards: { title: string; stat: Parameters<typeof topPlayersBy>[1]; fmt?: (n: number) => string }[] = [
    { title: "Top Scorers", stat: "goals" },
    { title: "Expected Goals (xG)", stat: "xg", fmt: (n) => n.toFixed(1) },
    { title: "Most Assists", stat: "assists" },
    { title: "Most Passes Completed", stat: "passes_completed" },
    { title: "Most Shots", stat: "shots" },
    { title: "Most Matches", stat: "matches" },
  ];

  return (
    <div>
      <PageHeader title="Stats" subtitle="Tournament leaderboards. For the full, sortable table, see Players." />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {boards.map((b) => {
          const rows = topPlayersBy(competition, b.stat, 10).map((p) => ({
            id: p.id,
            name: p.name,
            sub: p.team,
            value: b.fmt ? b.fmt(p[b.stat] as number) : (p[b.stat] as number),
            href: `/${competition}/players/${p.id}` as const,
          }));
          return <Leaderboard key={b.title} title={b.title} rows={rows} />;
        })}
      </div>

      <div className="mt-10">
        <ButtonLink href={`/${competition}/players` as Parameters<typeof ButtonLink>[0]["href"]}>
          Open the full player table →
        </ButtonLink>
      </div>
    </div>
  );
}
