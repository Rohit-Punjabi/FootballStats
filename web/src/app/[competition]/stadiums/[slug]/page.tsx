import Link from "next/link";
import { notFound } from "next/navigation";
import { getStadiums, getMatch, competitionSlugs, stadiumSlug } from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().flatMap((competition) =>
    getStadiums(competition).map((s) => ({ competition, slug: stadiumSlug(s.name) })),
  );
}

export default async function StadiumPage({ params }: PageProps<"/[competition]/stadiums/[slug]">) {
  const { competition, slug } = await params;
  const stadium = getStadiums(competition).find((s) => stadiumSlug(s.name) === slug);
  if (!stadium) notFound();

  const matches = stadium.match_ids
    .map((id) => getMatch(competition, id))
    .filter((m): m is NonNullable<typeof m> => m != null);
  const attendances = matches.map((m) => m.attendance).filter((a): a is number => a != null);
  const avgAtt = attendances.length
    ? Math.round(attendances.reduce((s, a) => s + a, 0) / attendances.length)
    : null;

  return (
    <div>
      <Link href={`/${competition}/stadiums`} className="text-sm text-primary hover:underline">
        ← All stadiums
      </Link>
      <h1 className="text-[32px] leading-tight font-bold tracking-tight mt-4">{stadium.name}</h1>
      <p className="text-muted mt-1">{stadium.match_count} matches hosted</p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <MetricCard value={stadium.match_count} label="Matches Hosted" />
        <MetricCard
          value={avgAtt != null ? avgAtt.toLocaleString() : "—"}
          label="Avg Attendance"
          accent="secondary"
        />
        <MetricCard
          value={matches.reduce((s, m) => s + (m.home_score ?? 0) + (m.away_score ?? 0), 0)}
          label="Goals Here"
          accent="muted"
        />
      </div>

      <Section title="Matches">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/${competition}/matches/${m.id}`}
              className="card card-hover px-5 py-3 flex items-center gap-3 text-sm"
            >
              <span className="flex-1 text-right truncate">{m.home_team}</span>
              <span className="stat-num font-bold">
                {m.home_score}-{m.away_score}
              </span>
              <span className="flex-1 truncate">{m.away_team}</span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
