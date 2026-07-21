import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatches, getMatch, getMatchDetail, getStadiums, stadiumSlug } from "@/lib/data";
import { ShotMap } from "@/components/ShotMap";

export function generateStaticParams() {
  return getMatches().map((m) => ({ id: String(m.id) }));
}

export default async function MatchPage({ params }: PageProps<"/matches/[id]">) {
  const { id } = await params;
  const match = getMatch(Number(id));
  if (!match) notFound();

  const detail = getMatchDetail(match.id);
  const shots = detail?.shots ?? [];
  const homeShots = shots.filter((s) => s.team === match.home_team);
  const awayShots = shots.filter((s) => s.team === match.away_team);
  const sumXg = (arr: typeof shots) =>
    arr.reduce((s, x) => s + (x.xg ?? 0), 0).toFixed(2);

  const stadiumExists = match.stadium
    ? getStadiums().some((s) => s.name === match.stadium)
    : false;

  return (
    <div className="space-y-6">
      <Link href="/matches" className="text-sm text-accent hover:underline">
        ← All matches
      </Link>

      {/* Scoreline */}
      <div className="card p-6">
        <p className="text-center text-muted text-sm">
          {match.stage} · {match.date}
          {match.stadium && (
            <>
              {" · "}
              {stadiumExists ? (
                <Link
                  href={`/stadiums/${stadiumSlug(match.stadium)}`}
                  className="hover:text-accent"
                >
                  {match.stadium}
                </Link>
              ) : (
                match.stadium
              )}
            </>
          )}
        </p>
        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="flex-1 text-right text-xl font-semibold">{match.home_team}</span>
          <span className="stat-num text-4xl font-bold">
            {match.home_score} <span className="text-muted">–</span> {match.away_score}
          </span>
          <span className="flex-1 text-left text-xl font-semibold">{match.away_team}</span>
        </div>
        <div className="flex items-center justify-center gap-6 mt-2 text-sm text-muted">
          <span className="flex-1 text-right stat-num">xG {sumXg(homeShots)}</span>
          <span className="px-4">expected goals</span>
          <span className="flex-1 text-left stat-num">{sumXg(awayShots)}</span>
        </div>
      </div>

      {shots.length > 0 ? (
        <ShotMap shots={shots} homeTeam={match.home_team} awayTeam={match.away_team} />
      ) : (
        <p className="text-muted text-sm">No shot data available for this match.</p>
      )}
    </div>
  );
}
