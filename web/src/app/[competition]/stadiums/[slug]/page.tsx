import Link from "next/link";
import { notFound } from "next/navigation";
import { getStadiums, getMatch, competitionSlugs, stadiumSlug } from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";
import { TeamBadge } from "@/components/TeamBadge";

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
        Back to all stadiums
      </Link>
      <div className="flex items-center gap-4 mt-4">
        <span aria-hidden className="text-4xl">🏟️</span>
        <div>
          <h1 className="text-[32px] leading-tight font-bold tracking-tight">{stadium.name}</h1>
          <p className="text-muted">{stadium.match_count} matches hosted</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <MetricCard value={stadium.match_count} label="Matches Hosted" icon="📅" />
        <MetricCard
          value={avgAtt != null ? avgAtt.toLocaleString() : "n/a"}
          label="Avg Attendance"
          accent="secondary"
          icon="👥"
        />
        <MetricCard
          value={matches.reduce((s, m) => s + (m.home_score ?? 0) + (m.away_score ?? 0), 0)}
          label="Goals Here"
          accent="muted"
          icon="⚽"
        />
      </div>

      <Section title="Matches">
        <div className="grid gap-3 sm:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/${competition}/matches/${m.id}`}
              className="card card-hover px-5 py-3 flex items-center gap-2 text-sm"
            >
              <span className="flex-1 flex items-center justify-end gap-2 min-w-0">
                <span className="truncate">{m.home_team}</span>
                <TeamBadge team={m.home_team} size="sm" />
              </span>
              <span className="stat-num font-bold">
                {m.home_score}&nbsp;·&nbsp;{m.away_score}
              </span>
              <span className="flex-1 flex items-center gap-2 min-w-0">
                <TeamBadge team={m.away_team} size="sm" />
                <span className="truncate">{m.away_team}</span>
              </span>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
