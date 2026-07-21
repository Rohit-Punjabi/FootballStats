import type { Shot } from "@/lib/data";

/**
 * Shot map on a StatsBomb pitch (120 long × 80 wide).
 *
 * In StatsBomb data the attacking team always moves toward x = 120, so raw
 * coordinates for both teams overlap on the same goal. We keep the home team
 * attacking the right goal and mirror the away team to the left goal, so the
 * two teams read as playing against each other on one pitch.
 *
 * Marker size ∝ xG; goals are filled, other shots are hollow.
 */
export function ShotMap({
  shots,
  homeTeam,
  awayTeam,
}: {
  shots: Shot[];
  homeTeam: string;
  awayTeam: string;
}) {
  const L = 120;
  const W = 80;

  const placed = shots
    .filter((s) => s.x != null && s.y != null)
    .map((s) => {
      const home = s.team === homeTeam;
      return {
        ...s,
        cx: home ? s.x! : L - s.x!,
        cy: home ? s.y! : W - s.y!,
        home,
        isGoal: s.outcome === "Goal",
        r: 0.7 + Math.sqrt(Math.max(s.xg ?? 0, 0)) * 3.2,
      };
    });

  const homeColor = "var(--color-accent)";
  const awayColor = "#e0762f";

  return (
    <div className="card p-3">
      <div className="flex justify-between text-sm mb-2 px-1">
        <span className="font-medium" style={{ color: homeColor }}>
          ● {homeTeam} →
        </span>
        <span className="font-medium" style={{ color: awayColor }}>
          ← {awayTeam} ●
        </span>
      </div>
      <svg viewBox={`-2 -2 ${L + 4} ${W + 4}`} className="w-full h-auto">
        {/* pitch */}
        <g fill="none" stroke="var(--color-border)" strokeWidth="0.4">
          <rect x="0" y="0" width={L} height={W} />
          <line x1={L / 2} y1="0" x2={L / 2} y2={W} />
          <circle cx={L / 2} cy={W / 2} r="10" />
          {/* penalty boxes */}
          <rect x="0" y={(W - 44) / 2} width="18" height="44" />
          <rect x={L - 18} y={(W - 44) / 2} width="18" height="44" />
          {/* six-yard boxes */}
          <rect x="0" y={(W - 20) / 2} width="6" height="20" />
          <rect x={L - 6} y={(W - 20) / 2} width="6" height="20" />
        </g>

        {/* shots — goals drawn last so they sit on top */}
        {[...placed]
          .sort((a, b) => Number(a.isGoal) - Number(b.isGoal))
          .map((s, i) => {
            const color = s.home ? homeColor : awayColor;
            return (
              <circle
                key={i}
                cx={s.cx}
                cy={s.cy}
                r={s.r}
                fill={s.isGoal ? color : "transparent"}
                stroke={color}
                strokeWidth="0.5"
                fillOpacity={s.isGoal ? 0.9 : 0}
              >
                <title>
                  {s.player}, {s.minute}&apos; · xG {(s.xg ?? 0).toFixed(2)} ·{" "}
                  {s.outcome}
                </title>
              </circle>
            );
          })}
      </svg>
      <p className="text-xs text-muted mt-2 px-1">
        Bigger circles are better chances (higher xG). Filled circles are goals. Hover over any
        shot to see the details.
      </p>
    </div>
  );
}
