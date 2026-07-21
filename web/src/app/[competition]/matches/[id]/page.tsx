import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getMatches,
  getMatch,
  getMatchDetail,
  getStadiums,
  competitionSlugs,
  stadiumSlug,
} from "@/lib/data";
import { ShotMap } from "@/components/ShotMap";
import { Section } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().flatMap((competition) =>
    getMatches(competition).map((m) => ({ competition, id: String(m.id) })),
  );
}

export default async function MatchPage({ params }: PageProps<"/[competition]/matches/[id]">) {
  const { competition, id } = await params;
  const match = getMatch(competition, Number(id));
  if (!match) notFound();

  const shots = getMatchDetail(competition, match.id)?.shots ?? [];
  const homeShots = shots.filter((s) => s.team === match.home_team);
  const awayShots = shots.filter((s) => s.team === match.away_team);
  const sumXg = (arr: typeof shots) => arr.reduce((s, x) => s + (x.xg ?? 0), 0).toFixed(2);
  const stadiumExists = match.stadium
    ? getStadiums(competition).some((s) => s.name === match.stadium)
    : false;

  return (
    <div>
      <Link href={`/${competition}/matches`} className="text-sm text-primary hover:underline">
        ← All matches
      </Link>

      <div className="card p-8 mt-4">
        <p className="text-center text-muted text-sm">
          {match.stage} · {match.date}
          {match.stadium && (
            <>
              {" · "}
              {stadiumExists ? (
                <Link
                  href={`/${competition}/stadiums/${stadiumSlug(match.stadium)}`}
                  className="hover:text-primary"
                >
                  {match.stadium}
                </Link>
              ) : (
                match.stadium
              )}
            </>
          )}
        </p>
        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="flex-1 text-right text-xl font-semibold">{match.home_team}</span>
          <span className="stat-num text-4xl font-bold">
            {match.home_score} <span className="text-faint">–</span> {match.away_score}
          </span>
          <span className="flex-1 text-left text-xl font-semibold">{match.away_team}</span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-3 text-sm text-muted">
          <span className="flex-1 text-right stat-num">xG {sumXg(homeShots)}</span>
          <span className="px-4 text-xs uppercase tracking-wide">expected goals</span>
          <span className="flex-1 text-left stat-num">{sumXg(awayShots)}</span>
        </div>
      </div>

      {shots.length > 0 ? (
        <Section title="Shot map">
          <ShotMap shots={shots} homeTeam={match.home_team} awayTeam={match.away_team} />
        </Section>
      ) : (
        <p className="text-muted text-sm mt-8">No shot data available for this match.</p>
      )}
    </div>
  );
}
