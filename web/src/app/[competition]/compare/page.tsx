import { notFound } from "next/navigation";
import { getPlayers, getCompetition, competitionSlugs } from "@/lib/data";
import { PageHeader } from "@/components/ui";
import { CompareTool } from "@/components/CompareTool";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function ComparePage({ params }: PageProps<"/[competition]/compare">) {
  const { competition } = await params;
  if (!getCompetition(competition)) notFound();
  const players = getPlayers(competition);

  return (
    <div>
      <PageHeader
        title="Compare players"
        subtitle="Pick any two players to see their tournament stats head to head."
      />
      <CompareTool players={players} slug={competition} />
    </div>
  );
}
