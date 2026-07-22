import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompetition,
  getMatch,
  competitionSlugs,
  competitionLabel,
} from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";
import { TeamBadge } from "@/components/TeamBadge";
import { CountUp } from "@/components/CountUp";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function CompetitionOverview({ params }: PageProps<"/[competition]"> ) {
  const { competition } = await params;
  const c = getCompetition(competition);
  if (!c) notFound();

  const label = competitionLabel(c);
  const final = c.final_match_id ? getMatch(competition, c.final_match_id) : undefined;

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
        {c.champion && <span className="chip">🏆 Champions</span>}
        <div className="flex items-center gap-4 mt-5">
          {c.champion && <TeamBadge team={c.champion} size="lg" />}
          <h1
            className="text-[40px] sm:text-[64px] leading-[1.02] font-bold tracking-tight max-w-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {c.champion ? `${c.champion} won the ${label}.` : label}
          </h1>
        </div>
        {c.top_scorer && (
          <p className="text-muted text-lg mt-5 max-w-2xl">
            ⚽ {c.top_scorer.name} took the Golden Boot with{" "}
            <span className="text-secondary font-bold stat-num">{c.top_scorer.goals} goals</span> for{" "}
            {c.top_scorer.team}.
          </p>
        )}
      </section>

      {/* Key metrics — big numbers that count up */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <MetricCard value={<CountUp to={c.match_count} />} label="Matches" icon="📅" />
        <MetricCard value={<CountUp to={c.goal_count} />} label="Goals" accent="secondary" icon="⚽" />
        <MetricCard value={<CountUp to={c.team_count} />} label="Teams" accent="accent" icon="🌍" />
        <MetricCard value={<CountUp to={c.player_count} />} label="Players" accent="muted" icon="👥" />
      </div>

      {/* Featured: the final */}
      {final && (
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
      )}

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
