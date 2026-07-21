import Link from "next/link";
import { getStadiums, stadiumSlug } from "@/lib/data";
import { PageHeader } from "@/components/ui";

export default function StadiumsPage() {
  const stadiums = getStadiums();
  return (
    <div>
      <PageHeader title="Stadiums" subtitle={`${stadiums.length} venues`} />
      <div className="grid gap-2 sm:grid-cols-2">
        {stadiums.map((s) => (
          <Link
            key={s.name}
            href={`/stadiums/${stadiumSlug(s.name)}`}
            className="card px-4 py-3 flex items-center justify-between hover:border-accent transition-colors"
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-muted text-sm stat-num">{s.match_count} matches</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
