import Link from "next/link";
import { getTeams } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export default function TeamsPage() {
  const teams = getTeams();
  return (
    <div>
      <PageHeader title="Teams" subtitle={`${teams.length} teams`} />
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/teams/${t.id}`}
            className="card px-4 py-3 font-medium hover:border-accent hover:text-accent transition-colors"
          >
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
