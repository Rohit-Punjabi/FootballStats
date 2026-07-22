/** A titled card with a table of stats: label · total · per-90 (optional). */
export type StatRow = { label: string; value: React.ReactNode; per90?: number | null };

export function StatBlock({ title, rows }: { title: string; rows: StatRow[] }) {
  const anyPer90 = rows.some((r) => r.per90 != null);
  return (
    <div className="card overflow-hidden">
      <h3 className="px-5 py-3 font-semibold border-b border-border">{title}</h3>
      <table className="w-full text-sm">
        {anyPer90 && (
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-faint">
              <th className="px-5 py-1.5 text-left font-medium"></th>
              <th className="px-3 py-1.5 text-right font-medium">Total</th>
              <th className="px-5 py-1.5 text-right font-medium">/90</th>
            </tr>
          </thead>
        )}
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="px-5 py-2 text-muted">{r.label}</td>
              <td className="px-3 py-2 text-right stat-num font-semibold">{r.value}</td>
              {anyPer90 && (
                <td className="px-5 py-2 text-right stat-num text-muted w-14">
                  {r.per90 != null ? r.per90.toFixed(2) : ""}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
