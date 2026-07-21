import Link from "next/link";
import { notFound } from "next/navigation";
import { getStadiums, getMatch, stadiumSlug } from "@/lib/data";
import { PageHeader, StatTile } from "@/components/ui";

export function generateStaticParams() {
  return getStadiums().map((s) => ({ slug: stadiumSlug(s.name) }));
}

export default async function StadiumPage({ params }: PageProps<"/stadiums/[slug]">) {
  const { slug } = await params;
  const stadium = getStadiums().find((s) => stadiumSlug(s.name) === slug);
  if (!stadium) notFound();

  const matches = stadium.match_ids.map((id) => getMatch(id)).filter((m) => m != null);
  const attendances = matches
    .map((m) => m!.attendance)
    .filter((a): a is number => a != null);
  const avgAtt =
    attendances.length > 0
      ? Math.round(attendances.reduce((s, a) => s + a, 0) / attendances.length)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/stadiums" className="text-sm text-accent hover:underline">
          ← All stadiums
        </Link>
        <PageHeader title={stadium.name} subtitle={`${stadium.match_count} matches hosted`} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Matches Hosted" value={stadium.match_count} />
        <StatTile
          label="Avg Attendance"
          value={avgAtt != null ? avgAtt.toLocaleString() : "—"}
        />
        <StatTile
          label="Goals Here"
          value={matches.reduce(
            (s, m) => s + (m!.home_score ?? 0) + (m!.away_score ?? 0),
            0,
          )}
        />
      </div>

      <section>
        <h2 className="font-semibold mb-2">Matches</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {matches.map((m) => (
            <Link
              key={m!.id}
              href={`/matches/${m!.id}`}
              className="card px-4 py-2 flex items-center gap-3 hover:border-accent transition-colors text-sm"
            >
              <span className="flex-1 text-right truncate">{m!.home_team}</span>
              <span className="stat-num font-bold">
                {m!.home_score}-{m!.away_score}
              </span>
              <span className="flex-1 truncate">{m!.away_team}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
