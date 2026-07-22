import type { PassNetwork as PassNetworkData } from "@/lib/data";
import { teamInfo } from "@/lib/teams";

/**
 * Pass network on a pitch: players at their average pass position, linked by the
 * passes they exchanged (thicker line = more passes). Shows a team's structure
 * and its main combinations. Team attacks left → right. Pure SVG.
 */
function toRgb(c: string): [number, number, number] {
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgb = c.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return [128, 128, 128];
}
function lum(c: string): number {
  const [r, g, b] = toRgb(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
/** Blend toward white by `t` (0..1). */
function lighten(c: string, t: number): string {
  const [r, g, b] = toRgb(c);
  const mix = (x: number) => Math.round(x + (255 - x) * t);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

export function PassNetwork({ team, network }: { team: string; network: PassNetworkData }) {
  const L = 120;
  const Wd = 80;
  const raw = teamInfo(team).color;
  // Dark kit colours (navy, black) vanish on the dark pitch — lighten them for the viz.
  const color = lum(raw) < 0.22 ? lighten(raw, 0.55) : raw;
  const textColor = lum(color) > 0.6 ? "#0b1020" : "#ffffff";

  const byId = new Map(network.nodes.map((n) => [n.id, n]));
  const maxPasses = Math.max(1, ...network.nodes.map((n) => n.passes));
  const maxW = Math.max(1, ...network.edges.map((e) => e.weight));

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="card p-3">
      <div className="flex items-center gap-2 text-sm mb-2 px-1">
        <span
          aria-hidden
          className="inline-grid place-items-center w-6 h-6 rounded-md text-[10px] font-bold"
          style={{ background: color, color: textColor }}
        >
          {teamInfo(team).code}
        </span>
        <span className="font-medium">{team} passing network →</span>
      </div>
      <svg viewBox={`-3 -3 ${L + 6} ${Wd + 6}`} className="w-full h-auto">
        <g fill="none" stroke="var(--color-border)" strokeWidth="0.5">
          <rect x="0" y="0" width={L} height={Wd} />
          <line x1={L / 2} y1="0" x2={L / 2} y2={Wd} />
          <circle cx={L / 2} cy={Wd / 2} r="10" />
          <rect x="0" y={(Wd - 44) / 2} width="18" height="44" />
          <rect x={L - 18} y={(Wd - 44) / 2} width="18" height="44" />
        </g>

        {/* edges */}
        {network.edges.map((e, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={0.4 + (e.weight / maxW) * 2.4}
              strokeOpacity={0.18 + (e.weight / maxW) * 0.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* nodes */}
        {network.nodes.map((n) => {
          const r = 2 + (n.passes / maxPasses) * 3;
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={r} fill={color} stroke="var(--color-card)" strokeWidth="0.4">
                <title>
                  {n.name} · {n.passes} passes
                </title>
              </circle>
              <text
                x={n.x}
                y={n.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="2"
                fontWeight="700"
                fill={textColor}
              >
                {initials(n.name)}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-xs text-muted mt-2 px-1">
        Circle size = passes played. Line thickness = passes between the pair (min. 3).
      </p>
    </div>
  );
}
