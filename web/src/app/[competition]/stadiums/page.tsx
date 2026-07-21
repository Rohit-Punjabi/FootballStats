import Link from "next/link";
import { notFound } from "next/navigation";
import { getStadiums, getCompetition, competitionSlugs, stadiumSlug } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function StadiumsPage({ params }: PageProps<"/[competition]/stadiums">) {
  const { competition } = await params;
  if (!getCompetition(competition)) notFound();
  const stadiums = getStadiums(competition);

  return (
    <div>
      <PageHeader title="Stadiums" subtitle={`${stadiums.length} venues`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {stadiums.map((s) => (
          <Link
            key={s.name}
            href={`/${competition}/stadiums/${stadiumSlug(s.name)}`}
            className="card card-hover px-5 py-4 flex items-center justify-between"
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-muted text-sm stat-num">{s.match_count} matches</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
