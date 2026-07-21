import { notFound } from "next/navigation";
import { getCompetition, competitionSlugs, competitionLabel } from "@/lib/data";
import { CompetitionNav } from "@/components/CompetitionNav";
import { Container } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function CompetitionLayout({
  children,
  params,
}: LayoutProps<"/[competition]">) {
  const { competition } = await params;
  const meta = getCompetition(competition);
  if (!meta) notFound();

  return (
    <>
      <CompetitionNav slug={competition} label={competitionLabel(meta)} />
      <Container className="py-10">{children}</Container>
    </>
  );
}
