import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCompetition,
  getMatch,
  competitionSlugs,
  competitionLabel,
} from "@/lib/data";
import { MetricCard, Section } from "@/components/ui";

export function generateStaticParams() {
  return competitionSlugs().map((competition) => ({ competition }));
}

export default async function CompetitionOverview({ params }: PageProps<"/[competition]"> ) {
  const { competition } = await params;
  const c = getCompetition(competition);
  if (!c) notFound();

  const label = competitionLabel(c);
  const final = c.final_match_id ? getMatch(competition, c.final_match_id) : undefined;

  const explore: { href: string; title: string; desc: string }[] = [
    { href: `/${competition}/matches`, title: "Matches", desc: `All ${c.match_count} games, with shot maps and xG` },
    { href: `/${competition}/players`, title: "Players", desc: `Search & sort ${c.player_count} players` },
    { href: `/${competition}/compare`, title: "Compare", desc: "Two players, head to head" },
    { href: `/${competition}/stats`, title: "Stats", desc: "Leaderboards and the full data tables" },
  ];

  return (
    <div>
      {/* Hero — the story, not a spreadsheet */}
      <section className="max-w-2xl">
        {c.champion && <span className="chip">🏆 Champions</span>}
        <h1 className="text-[32px] sm:text-[40px] leading-tight font-bold tracking-tight mt-4">
          {c.champion ? (
            <>
              {c.champion} won the {label}.
            </>
          ) : (
            label
          )}
        </h1>
        {c.top_scorer && (
          <p className="text-muted text-lg mt-3">
            {c.top_scorer.name} took the Golden Boot with{" "}
            <span className="text-fg font-semibold">{c.top_scorer.goals} goals</span> for{" "}
            {c.top_scorer.team}.
          </p>
        )}
      </section>

      {/* Key metrics — number-first */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
        <MetricCard value={c.match_count} label="Matches" />
        <MetricCard value={c.goal_count} label="Goals" accent="secondary" />
        <MetricCard value={c.team_count} label="Teams" accent="muted" />
        <MetricCard value={c.player_count} label="Players" accent="muted" />
      </div>

      {/* Featured: the final */}
      {final && (
        <Section title="The final">
          <Link
            href={`/${competition}/matches/${final.id}`}
            className="card card-hover p-8 flex items-center justify-center gap-8"
          >
            <span className="flex-1 text-right text-xl font-semibold">{final.home_team}</span>
            <span className="stat-num text-4xl font-bold">
              {final.home_score} <span className="text-faint">–</span> {final.away_score}
            </span>
            <span className="flex-1 text-left text-xl font-semibold">{final.away_team}</span>
          </Link>
        </Section>
      )}

      {/* Explore — clear entry points, progressive disclosure */}
      <Section title="Explore">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {explore.map((e) => (
            <Link key={e.href} href={e.href} className="card card-hover p-6">
              <div className="font-semibold text-lg">{e.title}</div>
              <p className="text-muted text-sm mt-1">{e.desc}</p>
            </Link>
          ))}
        </div>
      </Section>
    </div>
  );
}
