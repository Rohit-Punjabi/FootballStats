import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompetition,
  getMatch,
  getStandings,
  competitionSlugs,
  competitionLabel,
} from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";
import { TeamBadge } from "@/components/TeamBadge";
import { CountUp } from "@/components/CountUp";
import { StandingsTable } from "@/components/StandingsTable";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function CompetitionOverview({ params }: PageProps<"/[competition]"> ) {
  const { competition } = await params;
  const c = getCompetition(competition);
  if (!c) notFound();

  const label = competitionLabel(c);
  const final = c.final_match_id ? getMatch(competition, c.final_match_id) : undefined;
  const isClub = c.type === "club";
  const isLeague = c.type === "league";
  const standings = isLeague ? getStandings(competition) : [];
  const feature = c.champion ?? c.club; // team to badge in the hero

  const explore: { href: string; title: string; desc: string; icon: string }[] = [
    { href: `/${competition}/matches`, title: "Matches", icon: "🥅", desc: `All ${c.match_count} games, with shot maps and xG` },
    { href: `/${competition}/players`, title: "Players", icon: "👤", desc: `Search & sort ${c.player_count} players` },
    { href: `/${competition}/compare`, title: "Compare", icon: "⚖️", desc: "Two players, head to head" },
    { href: `/${competition}/stats`, title: "Stats", icon: "📊", desc: "Leaderboards and the full data tables" },
  ];

  return (
    <div>
      {/* Hero — Champions League night, not a spreadsheet */}
      <section
        className="relative overflow-hidden rounded-card p-8 sm:p-12 border border-border"
        style={{
          background:
            "radial-gradient(90% 140% at 100% 0%, color-mix(in srgb, #9333ea 32%, transparent), transparent 55%)," +
            "radial-gradient(90% 140% at 0% 100%, color-mix(in srgb, #3b82f6 30%, transparent), transparent 55%)," +
            "linear-gradient(135deg, var(--surface), var(--card))",
        }}
      >
        <span className="chip">{isClub ? "📅 Club season" : "🏆 Champions"}</span>
        <div className="flex items-center gap-4 mt-5">
          {feature && <TeamBadge team={feature} size="lg" />}
          <h1
            className="text-[40px] sm:text-[64px] leading-[1.02] font-bold tracking-tight max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isClub ? c.club : c.champion ? `${c.champion} won the ${label}.` : label}
          </h1>
        </div>
        {isClub && c.record ? (
          <p className="text-muted text-lg mt-5 max-w-2xl">
            {label} ·{" "}
            <span className="text-fg font-semibold stat-num">
              {c.record.w}W {c.record.d}D {c.record.l}L
            </span>
            , {c.record.points} pts.
            {c.top_scorer && (
              <>
                {" "}Top scorer{" "}
                <span className="text-secondary font-bold">{c.top_scorer.name}</span> ({c.top_scorer.goals}).
              </>
            )}
          </p>
        ) : (
          c.top_scorer && (
            <p className="text-muted text-lg mt-5 max-w-2xl">
              ⚽ {c.top_scorer.name} took the Golden Boot with{" "}
              <span className="text-secondary font-bold stat-num">{c.top_scorer.goals} goals</span> for{" "}
              {c.top_scorer.team}.
            </p>
          )
        )}
      </section>

      {/* Key metrics — big numbers that count up */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <MetricCard value={<CountUp to={c.match_count} />} label="Matches" icon="📅" />
        {isClub && c.record ? (
          <>
            <MetricCard value={<CountUp to={c.record.gf} />} label="Goals For" accent="secondary" icon="⚽" />
            <MetricCard value={<CountUp to={c.record.points} />} label="Points" accent="accent" icon="🏅" />
          </>
        ) : (
          <>
            <MetricCard value={<CountUp to={c.goal_count} />} label="Goals" accent="secondary" icon="⚽" />
            <MetricCard value={<CountUp to={c.team_count} />} label="Teams" accent="accent" icon="🌍" />
          </>
        )}
        <MetricCard value={<CountUp to={c.player_count} />} label="Players" accent="muted" icon="👥" />
      </div>

      {/* Featured: league table, season record, or the final */}
      {isLeague && standings.length > 0 ? (
        <Section title="League table">
          <StandingsTable standings={standings} slug={competition} />
        </Section>
      ) : isClub && c.record ? (
        <Section title="Season record">
          <div className="card p-8 flex flex-wrap items-center justify-center gap-10 text-center">
            <div>
              <div className="stat-num text-[44px] leading-none font-bold">
                {c.record.w}<span className="text-faint">-</span>{c.record.d}<span className="text-faint">-</span>{c.record.l}
              </div>
              <div className="text-muted text-sm mt-1">Won · Drawn · Lost</div>
            </div>
            <div>
              <div className="stat-num text-[44px] leading-none font-bold text-secondary">{c.record.points}</div>
              <div className="text-muted text-sm mt-1">Points</div>
            </div>
            <div>
              <div className="stat-num text-[44px] leading-none font-bold">
                {c.record.gf}<span className="text-faint">:</span>{c.record.ga}
              </div>
              <div className="text-muted text-sm mt-1">Goals for · against</div>
            </div>
          </div>
        </Section>
      ) : final ? (
        <Section title="The final">
          <Link
            href={`/${competition}/matches/${final.id}`}
            className="card card-hover p-8 flex items-center justify-center gap-6"
          >
            <span className="flex-1 flex items-center justify-end gap-3 text-xl font-semibold">
              <span className="truncate">{final.home_team}</span>
              <TeamBadge team={final.home_team} size="lg" />
            </span>
            <span className="stat-num text-[56px] leading-none font-bold">
              {final.home_score} <span className="text-faint">·</span> {final.away_score}
            </span>
            <span className="flex-1 flex items-center gap-3 text-xl font-semibold">
              <TeamBadge team={final.away_team} size="lg" />
              <span className="truncate">{final.away_team}</span>
            </span>
          </Link>
        </Section>
      ) : null}

      {/* Explore — clear entry points, progressive disclosure */}
      <Section title="Explore">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {explore.map((e) => (
            <Link key={e.href} href={e.href} className="card card-hover p-6">
              <div className="text-2xl">{e.icon}</div>
              <div className="font-semibold text-lg mt-2">{e.title}</div>
              <p className="text-muted text-sm mt-1">{e.desc}</p>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
