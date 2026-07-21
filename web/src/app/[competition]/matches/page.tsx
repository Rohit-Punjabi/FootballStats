import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatches, getCompetition, competitionSlugs } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function MatchesPage({ params }: PageProps<"/[competition]/matches">) {
  const { competition } = await params;
  if (!getCompetition(competition)) notFound();
  const matches = getMatches(competition);

  const stages: Record<string, typeof matches> = {};
  for (const m of matches) (stages[m.stage ?? "Other"] ??= []).push(m);

  return (
    <div>
      <PageHeader title="Matches" subtitle={`${matches.length} matches`} />
      <div className="space-y-10">
        {Object.entries(stages).map(([stage, ms]) => (
          <section key={stage}>
            <h2 className="text-[13px] uppercase tracking-wide text-muted font-medium mb-3">{stage}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ms.map((m) => (
                <Link
                  key={m.id}
                  href={`/${competition}/matches/${m.id}`}
                  className="card card-hover px-5 py-4 flex items-center gap-3"
                >
                  <span className="flex-1 text-right truncate">{m.home_team}</span>
                  <span className="stat-num font-bold px-2">
                    {m.home_score}&nbsp;-&nbsp;{m.away_score}
                  </span>
                  <span className="flex-1 truncate">{m.away_team}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
