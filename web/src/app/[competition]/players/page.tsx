import { notFound } from "next/navigation";
import { getPlayers, getCompetition, competitionSlugs } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { PlayerTable } from "@/components/PlayerTable";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function PlayersPage({ params }: PageProps<"/[competition]/players">) {
  const { competition } = await params;
  if (!getCompetition(competition)) notFound();
  const players = getPlayers(competition);

  return (
    <div>
      <PageHeader
        title="Players"
        subtitle={`${players.length} players. Search, sort, and page through them all.`}
      />
      <PlayerTable players={players} slug={competition} />
    </div>
  );
}
