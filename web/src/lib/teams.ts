/**
 * Team identity: a FIFA-style 3-letter code and a kit-inspired colour for every
 * national team in the loaded competitions.
 *
 * We render these as coloured badges rather than flag emoji on purpose — flag
 * emoji don't render as flags on Windows/Chrome (they show the letters), so a
 * coloured code badge looks consistent on every platform.
 */
type TeamInfo = { code: string; color: string };

const TEAMS: Record<string, TeamInfo> = {
  Argentina: { code: "ARG", color: "#6CACE4" },
  Australia: { code: "AUS", color: "#00843D" },
  Belgium: { code: "BEL", color: "#C8102E" },
  Bolivia: { code: "BOL", color: "#007A33" },
  Brazil: { code: "BRA", color: "#FEDD00" },
  Cameroon: { code: "CMR", color: "#007A5E" },
  Canada: { code: "CAN", color: "#FF0000" },
  Chile: { code: "CHI", color: "#D52B1E" },
  Colombia: { code: "COL", color: "#FCD116" },
  "Costa Rica": { code: "CRC", color: "#002B7F" },
  Croatia: { code: "CRO", color: "#E01A22" },
  Denmark: { code: "DEN", color: "#C60C30" },
  Ecuador: { code: "ECU", color: "#FFD100" },
  England: { code: "ENG", color: "#1D3C77" },
  France: { code: "FRA", color: "#002654" },
  Germany: { code: "GER", color: "#1A1A1A" },
  Ghana: { code: "GHA", color: "#006B3F" },
  Iran: { code: "IRN", color: "#239F40" },
  Jamaica: { code: "JAM", color: "#009B3A" },
  Japan: { code: "JPN", color: "#0B1F4D" },
  Mexico: { code: "MEX", color: "#006847" },
  Morocco: { code: "MAR", color: "#C1272D" },
  Netherlands: { code: "NED", color: "#F36C21" },
  Panama: { code: "PAN", color: "#005293" },
  Paraguay: { code: "PAR", color: "#D52B1E" },
  Peru: { code: "PER", color: "#D91023" },
  Poland: { code: "POL", color: "#DC143C" },
  Portugal: { code: "POR", color: "#006600" },
  Qatar: { code: "QAT", color: "#8A1538" },
  "Saudi Arabia": { code: "KSA", color: "#006C35" },
  Senegal: { code: "SEN", color: "#00853F" },
  Serbia: { code: "SRB", color: "#C6363C" },
  "South Korea": { code: "KOR", color: "#CD2E3A" },
  Spain: { code: "ESP", color: "#C60B1E" },
  Switzerland: { code: "SUI", color: "#D52B1E" },
  Tunisia: { code: "TUN", color: "#E70013" },
  "United States": { code: "USA", color: "#0A3161" },
  Uruguay: { code: "URU", color: "#5C97D6" },
  Venezuela: { code: "VEN", color: "#6E1423" },
  Wales: { code: "WAL", color: "#C8102E" },
};

/** Deterministic fallback for any team not in the map. */
function fallback(name: string): TeamInfo {
  const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return { code, color: `hsl(${hash % 360} 55% 45%)` };
}

export function teamInfo(name: string): TeamInfo {
  return TEAMS[name] ?? fallback(name);
}

/** Pick black or white text for legibility on a given hex background. */
export function readableText(color: string): string {
  const m = color.match(/^#([0-9a-f]{6})$/i);
  if (!m) return "#ffffff"; // hsl fallbacks are mid-tone → white reads fine
  const n = parseInt(m[1], 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // relative luminance (sRGB approximation)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#0b1220" : "#ffffff";
}
