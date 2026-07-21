import { teamInfo, readableText } from "@/lib/teams";

/**
 * A small coloured badge showing a team's FIFA-style code — the team's "logo"
 * throughout the site. Sizes: sm (list rows), md (cards), lg (heroes/scores).
 */
export function TeamBadge({
  team,
  size = "md",
}: {
  team: string;
  size?: "sm" | "md" | "lg";
}) {
  const { code, color } = teamInfo(team);
  const text = readableText(color);
  const dims = {
    sm: { w: 26, h: 26, fs: 9 },
    md: { w: 34, h: 34, fs: 11 },
    lg: { w: 52, h: 52, fs: 16 },
  }[size];

  return (
    <span
      aria-hidden
      className="inline-grid place-items-center rounded-xl font-bold shrink-0 tracking-tight"
      style={{
        width: dims.w,
        height: dims.h,
        fontSize: dims.fs,
        background: `linear-gradient(145deg, ${color}, ${color}cc)`,
        color: text,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
      }}
    >
      {code}
    </span>
  );
}
