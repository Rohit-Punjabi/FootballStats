import Link from "next/link";
import { getCompetitions, competitionLabel } from "@/lib/data";
import { Container } from "@/components/ui";
import { TeamBadge } from "@/components/TeamBadge";

export default function Home() {
  const competitions = getCompetitions();

  return (
    <Container className="py-16">
      {/* Hero — big, electric, one idea */}
      <section
        className="relative overflow-hidden rounded-card border border-border px-8 py-16 sm:px-12 sm:py-20"
        style={{
          background:
            "radial-gradient(80% 130% at 100% 0%, color-mix(in srgb, #9333ea 34%, transparent), transparent 55%)," +
            "radial-gradient(90% 130% at 0% 100%, color-mix(in srgb, #3b82f6 32%, transparent), transparent 55%)," +
            "linear-gradient(135deg, var(--surface), var(--card))",
        }}
      >
        <div className="max-w-3xl">
          <span className="chip">⚡ Every pass. Every shot. Every story.</span>
          <h1
            className="text-[48px] sm:text-[72px] leading-[0.98] font-bold tracking-tight mt-6"
            style={{ fontFamily: "var(--font-display)" }}
          >
            The story behind <span className="text-gradient">the numbers</span>.
          </h1>
          <p className="text-muted text-lg mt-6 max-w-xl">
            A bold, visual home for football stats — shot maps, expected goals, and the details
            that make a match make sense. Pick a tournament and dive in.
          </p>
        </div>
      </section>

      {/* Competition picker */}
      <section className="mt-12 grid gap-5 sm:grid-cols-2">
        {competitions.map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="card card-hover p-7 flex flex-col gap-5"
          >
            <div className="flex items-start gap-4">
              {c.champion && <TeamBadge team={c.champion} size="lg" />}
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{competitionLabel(c)}</h2>
                <p className="text-muted mt-1">
                  {c.match_count} matches · {c.team_count} teams · {c.player_count} players
                </p>
              </div>
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
