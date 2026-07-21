import Link from "next/link";
import { getMatches } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export default function MatchesPage() {
  const matches = getMatches();

  // Group by stage, preserving first-seen order.
  const stages: Record<string, typeof matches> = {};
  for (const m of matches) {
    const key = m.stage ?? "Other";
    (stages[key] ??= []).push(m);
  }

  return (
    <div>
      <PageHeader title="Matches" subtitle={`${matches.length} matches`} />
      <div className="space-y-8">
        {Object.entries(stages).map(([stage, ms]) => (
          <section key={stage}>
            <h2 className="text-sm uppercase tracking-wide text-muted mb-2">{stage}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {ms.map((m) => (
                <Link
                  key={m.id}
                  href={`/matches/${m.id}`}
                  className="card px-4 py-3 flex items-center gap-3 hover:border-accent transition-colors"
                >
                  <span className="flex-1 text-right truncate">{m.home_team}</span>
                  <span className="stat-num font-bold px-2">
                    {m.home_score}&nbsp;-&nbsp;{m.away_score}
                  </span>
                  <span className="flex-1 truncate">{m.away_team}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
