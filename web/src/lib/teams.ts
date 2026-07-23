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
  // Euro 2024 nations not already above
  Albania: { code: "ALB", color: "#E41E20" },
  Austria: { code: "AUT", color: "#ED2939" },
  "Czech Republic": { code: "CZE", color: "#D7141A" },
  Georgia: { code: "GEO", color: "#DA291C" },
  Hungary: { code: "HUN", color: "#CE1126" },
  Italy: { code: "ITA", color: "#0065A9" },
  Romania: { code: "ROU", color: "#002B7F" },
  Scotland: { code: "SCO", color: "#0B4EA2" },
  Slovakia: { code: "SVK", color: "#0B4EA2" },
  Slovenia: { code: "SVN", color: "#009BCE" },
  Turkey: { code: "TUR", color: "#E30A17" },
  Ukraine: { code: "UKR", color: "#005BBB" },

  // --- Clubs (Premier League 2003/04, La Liga 2020/21) ---
  Arsenal: { code: "ARS", color: "#EF0107" },
  "Aston Villa": { code: "AVL", color: "#670E36" },
  "Birmingham City": { code: "BIR", color: "#0000A8" },
  "Blackburn Rovers": { code: "BLB", color: "#009EE0" },
  "Bolton Wanderers": { code: "BOL", color: "#263C7E" },
  "Charlton Athletic": { code: "CHA", color: "#E31B23" },
  Chelsea: { code: "CHE", color: "#034694" },
  Everton: { code: "EVE", color: "#003399" },
  Fulham: { code: "FUL", color: "#1a1a1a" },
  "Leeds United": { code: "LEE", color: "#1D428A" },
  "Leicester City": { code: "LEI", color: "#003090" },
  Liverpool: { code: "LIV", color: "#C8102E" },
  "Manchester City": { code: "MCI", color: "#6CABDD" },
  "Manchester United": { code: "MUN", color: "#DA020E" },
  Middlesbrough: { code: "MID", color: "#E21C38" },
  "Newcastle United": { code: "NEW", color: "#1a1a1a" },
  Portsmouth: { code: "POR", color: "#001489" },
  Southampton: { code: "SOU", color: "#D71920" },
  "Tottenham Hotspur": { code: "TOT", color: "#132257" },
  "Wolverhampton Wanderers": { code: "WOL", color: "#FDB913" },
  "Athletic Club": { code: "ATH", color: "#EE2523" },
  "Atlético Madrid": { code: "ATM", color: "#CB3524" },
  Barcelona: { code: "BAR", color: "#A50044" },
  "Celta Vigo": { code: "CEL", color: "#8AC3EE" },
  "Cádiz": { code: "CAD", color: "#FFE500" },
  "Deportivo Alavés": { code: "ALA", color: "#0761AF" },
  Elche: { code: "ELC", color: "#00933B" },
  Getafe: { code: "GET", color: "#005999" },
  Granada: { code: "GRA", color: "#C6373D" },
  Huesca: { code: "HUE", color: "#005DA9" },
  "Levante UD": { code: "LEV", color: "#B4003C" },
  Osasuna: { code: "OSA", color: "#0A346F" },
  "Real Betis": { code: "BET", color: "#00954C" },
  "Real Madrid": { code: "RMA", color: "#00529F" },
  "Real Sociedad": { code: "RSO", color: "#143C8B" },
  "Real Valladolid": { code: "VLL", color: "#921C7A" },
  Sevilla: { code: "SEV", color: "#D9001B" },
  Valencia: { code: "VAL", color: "#FF7A00" },
  Villarreal: { code: "VIL", color: "#FDE100" },

  // --- More clubs (2015/16 Premier League + La Liga) ---
  "AFC Bournemouth": { code: "BOU", color: "#DA291C" },
  "Crystal Palace": { code: "CRY", color: "#1B458F" },
  "Norwich City": { code: "NOR", color: "#00A650" },
  "Stoke City": { code: "STK", color: "#E03A3E" },
  Sunderland: { code: "SUN", color: "#EB172B" },
  "Swansea City": { code: "SWA", color: "#1a1a1a" },
  Watford: { code: "WAT", color: "#FBEE23" },
  "West Bromwich Albion": { code: "WBA", color: "#122F67" },
  "West Ham United": { code: "WHU", color: "#7A263A" },
  Eibar: { code: "EIB", color: "#0B3B8F" },
  Espanyol: { code: "ESY", color: "#007FC8" },
  "Las Palmas": { code: "LPA", color: "#FEDD00" },
  "Málaga": { code: "MAL", color: "#00A3E0" },
  "RC Deportivo La Coruña": { code: "DEP", color: "#2E5C9E" },
  "Rayo Vallecano": { code: "RAY", color: "#E53027" },
  "Sporting Gijón": { code: "SPO", color: "#E30613" },
};

// Hex palette (badge gradient appends an alpha suffix, which needs hex not hsl).
const FALLBACK_COLORS = [
  "#4f6bed", "#0f9d58", "#d64545", "#e8a33d", "#8e44ad", "#0e9aa7",
  "#e8703a", "#5b4b8a", "#2e7d32", "#c2185b", "#3949ab", "#00838f",
];

/** Deterministic fallback for any team not in the map. */
function fallback(name: string): TeamInfo {
  const code = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "?";
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return { code, color: FALLBACK_COLORS[hash % FALLBACK_COLORS.length] };
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
