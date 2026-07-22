import type { Shot } from "@/lib/data";

/**
 * xG momentum / race chart — cumulative expected goals for each team over the
 * match, as step lines. Goals are marked with a filled dot. Pure SVG.
 */
export function XGTimeline({
  shots,
  homeTeam,
  awayTeam,
}: {
  shots: Shot[];
  homeTeam: string;
  awayTeam: string;
}) {
  const homeColor = "#38bdf8";
  const awayColor = "#ff3ea5";

  const build = (team: string) => {
    const s = shots
      .filter((x) => x.team === team && x.minute != null)
      .sort((a, b) => (a.minute! - b.minute!));
    let cum = 0;
    return s.map((x) => ({ minute: x.minute!, cum: (cum += x.xg ?? 0), goal: x.outcome === "Goal" }));
  };
  const home = build(homeTeam);
  const away = build(awayTeam);

  const maxMin = Math.max(90, ...shots.map((s) => s.minute ?? 0));
  const maxXg = Math.max(0.5, home.at(-1)?.cum ?? 0, away.at(-1)?.cum ?? 0);

  const W = 640;
  const H = 260;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const px = (m: number) => pad.l + (m / maxMin) * (W - pad.l - pad.r);
  const py = (v: number) => H - pad.b - (v / maxXg) * (H - pad.t - pad.b);

  // step-after path from (0,0)
  const path = (pts: { minute: number; cum: number }[]) => {
    let d = `M ${px(0)} ${py(0)}`;
    let prev = 0;
    for (const p of pts) {
      d += ` L ${px(p.minute)} ${py(prev)} L ${px(p.minute)} ${py(p.cum)}`;
      prev = p.cum;
    }
    d += ` L ${px(maxMin)} ${py(prev)}`;
    return d;
  };

  const yTicks = [0, maxXg / 2, maxXg];
  const xTicks = [0, 45, 90, maxMin > 90 ? maxMin : 90].filter((v, i, a) => a.indexOf(v) === i && v <= maxMin);

  return (
    <div className="card p-4">
      <div className="flex gap-4 text-sm mb-2 px-1">
        <span className="font-medium" style={{ color: homeColor }}>● {homeTeam} {(home.at(-1)?.cum ?? 0).toFixed(2)}</span>
        <span className="font-medium" style={{ color: awayColor }}>● {awayTeam} {(away.at(-1)?.cum ?? 0).toFixed(2)}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* axes */}
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={pad.l} y1={py(v)} x2={W - pad.r} y2={py(v)} stroke="var(--color-border)" strokeWidth="1" />
            <text x={pad.l - 6} y={py(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--color-muted)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {xTicks.map((m) => (
          <text key={`x${m}`} x={px(m)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
            {m}&apos;
          </text>
        ))}
        <text x={pad.l - 6} y={pad.t} textAnchor="end" fontSize="9" fill="var(--color-faint)">xG</text>

        {/* lines */}
        <path d={path(home)} fill="none" stroke={homeColor} strokeWidth="2.5" />
        <path d={path(away)} fill="none" stroke={awayColor} strokeWidth="2.5" />

        {/* goal markers */}
        {[[home, homeColor], [away, awayColor]].flatMap(([pts, color]) =>
          (pts as { minute: number; cum: number; goal: boolean }[])
            .filter((p) => p.goal)
            .map((p, i) => (
              <circle key={`${color}${i}`} cx={px(p.minute)} cy={py(p.cum)} r="4.5" fill={color as string} stroke="var(--color-card)" strokeWidth="1.5">
                <title>Goal · {p.minute}&apos; · {p.cum.toFixed(2)} cumulative xG</title>
              </circle>
            )),
        )}
      </svg>
      <p className="text-xs text-muted mt-1 px-1">
        Cumulative expected goals over time. Each step is a shot; dots are goals. Steeper = more chances.
      </p>
    </div>
  );
}
