/**
 * Percentile radar (a.k.a. pizza/spider chart) — each axis is a stat, the
 * distance from centre is the player's percentile rank vs. position peers.
 * Pure SVG, server-renderable; <title> gives a native hover tooltip per axis.
 */
export type RadarAxis = { label: string; percentile: number };

export function RadarChart({ data }: { data: RadarAxis[] }) {
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const R = 120;
  const n = data.length;

  const angle = (i: number) => (-90 + (i * 360) / n) * (Math.PI / 180);
  const pt = (i: number, r: number) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];

  const rings = [25, 50, 75, 100];
  const polygon = data
    .map((d, i) => pt(i, (Math.max(0, Math.min(100, d.percentile)) / 100) * R).join(","))
    .join(" ");

  return (
    <svg viewBox={`-64 -6 ${size + 128} ${size + 12}`} className="w-full max-w-[400px] mx-auto">
      {/* grid rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={data.map((_, i) => pt(i, (ring / 100) * R).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="1"
        />
      ))}
      {/* axes + labels */}
      {data.map((d, i) => {
        const [ex, ey] = pt(i, R);
        const [lx, ly] = pt(i, R + 16);
        const a = angle(i);
        const anchor = Math.abs(Math.cos(a)) < 0.4 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
        return (
          <g key={d.label}>
            <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="var(--color-border)" strokeWidth="1" />
            <text
              x={lx}
              y={ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fontSize="10"
              fill="var(--color-muted)"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      {/* player polygon */}
      <polygon
        points={polygon}
        fill="color-mix(in srgb, var(--color-primary) 30%, transparent)"
        stroke="var(--color-primary)"
        strokeWidth="2"
      />
      {/* vertices */}
      {data.map((d, i) => {
        const [x, y] = pt(i, (Math.max(0, Math.min(100, d.percentile)) / 100) * R);
        return (
          <circle key={d.label} cx={x} cy={y} r="3.5" fill="var(--color-primary)">
            <title>
              {d.label}: {d.percentile}th percentile
            </title>
          </circle>
        );
      })}
    </svg>
  );
}
