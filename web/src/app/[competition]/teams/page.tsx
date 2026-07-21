import Link from "next/link";
import { notFound } from "next/navigation";
import { getTeams, getCompetition, competitionSlugs } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function TeamsPage({ params }: PageProps<"/[competition]/teams">) {
  const { competition } = await params;
  if (!getCompetition(competition)) notFound();
  const teams = getTeams(competition);

  return (
    <div>
      <PageHeader title="Teams" subtitle={`${teams.length} teams`} />
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/${competition}/teams/${t.id}`}
            className="card card-hover px-5 py-4 font-medium"
          >
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
