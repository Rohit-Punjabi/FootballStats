import Link from "next/link";
import { getCompetitions, competitionLabel } from "@/lib/data";
import { Container } from "@/components/ui";

export default function Home() {
  const competitions = getCompetitions();

  return (
    <Container className="py-16">
      {/* Hero — calm, one idea */}
      <section className="max-w-3xl">
        <span className="chip">Insights first. Statistics second.</span>
        <h1 className="text-[40px] sm:text-5xl leading-[1.1] font-bold tracking-tight mt-5">
          The story behind the numbers.
        </h1>
        <p className="text-muted text-lg mt-4">
          A calm, visual home for football statistics — shot maps, expected goals, and
          the details that explain a match, not just list it. Choose a tournament to explore.
        </p>
      </section>

      {/* Competition picker */}
      <section className="mt-12 grid gap-5 sm:grid-cols-2">
        {competitions.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="card card-hover p-7 flex flex-col gap-5"
          >
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{competitionLabel(c)}</h2>
              <p className="text-muted mt-1">
                {c.match_count} matches · {c.team_count} teams · {c.player_count} players
              </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-auto">
              {c.champion && <span className="chip">🏆 {c.champion}</span>}
              {c.top_scorer && (
                <span className="chip">
                  ⚽ {c.top_scorer.name} · {c.top_scorer.goals}
                </span>
              )}
            </div>
          </Link>
        ))}
      </section>
    </Container>
  );
}
