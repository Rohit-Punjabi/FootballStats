# FootballStats

A calm, visual home for football statistics — shot maps, expected goals (xG), and
pass-level data for every match, player, team, and stadium. Built as a portfolio
project on **[StatsBomb Open Data](https://github.com/statsbomb/open-data)** (free,
non-commercial use).

Design principle: **insights first, statistics second.** Pages tell the story
(champion, golden boot, the final) before offering the deep tables.

Currently loaded: **World Cup 2022** and **Copa America 2024** — and adding another
tournament is a one-line config change, not a rewrite.

## How it works

Two clean halves — a Python pipeline that prepares data, and a Next.js site that reads it:

```
StatsBomb  →  pipeline/ (Python)  →  data/competitions/<slug>/*.json  →  web/ (Next.js SSG)
```

The site is **fully static**: every page is pre-rendered at build time, so it's fast
and can be hosted for free (e.g. Vercel).

## Multiple competitions

Each `(competition, season)` becomes a slug (e.g. `world-cup-2022`) with its own data
folder and its own URL space (`/world-cup-2022/players/…`). To add one, append to
`COMPETITIONS` in `pipeline/config.py` and re-run the pipeline:

```python
COMPETITIONS = [
    {"competition_name": "FIFA World Cup", "season_name": "2022"},
    {"competition_name": "Copa America",   "season_name": "2024"},
    # add more here — see `sb.competitions()` for what StatsBomb offers free
]
```

## Project layout

```
pipeline/     Python: fetch + transform StatsBomb data
  fetch.py       download raw data per competition   → data/raw/<slug>/
  transform.py   aggregate into clean JSON           → data/competitions/<slug>/
  config.py      COMPETITIONS list, slugs, paths, JSON helpers
data/
  competitions.json            index of all competitions (+ champion, golden boot)
  competitions/<slug>/         meta, matches, players, teams, stadiums, matches/<id>
  raw/<slug>/                  raw StatsBomb dumps (gitignored, regenerable)
web/          Next.js 16 app (App Router, TypeScript, Tailwind v4)
  src/lib/data.ts              THE data seam — every read goes through here
  src/app/page.tsx             landing: pick a competition
  src/app/[competition]/       overview + matches/players/teams/stadiums/compare/stats
  src/components/              ShotMap, PlayerTable, CompareTool, CompetitionNav, ui
```

## Scalability notes

- **More competitions:** config-driven; data and routes are competition-scoped.
- **More data:** per-competition JSON keeps files small; the player table paginates;
  and because every read goes through `src/lib/data.ts`, the flat-JSON backend can be
  swapped for a database or API without touching any page.
- **Design system:** tokens live in `src/app/globals.css` (colors, radii, shadows,
  spacing), mirroring the project `Design` file.

## Running it

**1. Generate the data** (first run downloads the raw dumps; cached after that):

```bash
cd pipeline
pip install -r requirements.txt
python fetch.py        # → data/raw/<slug>/   (skips already-downloaded competitions)
python transform.py    # → data/competitions/<slug>/
```

**2. Run the site:**

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # production build — prerenders every page
```

## Data notes

- **Goals/shots/xG exclude penalty-shootout kicks** (StatsBomb period 5) — those decide a
  tie separately and don't count as tournament goals. This is why top scorers match the
  official Golden Boots (World Cup: Mbappé 8; Copa America: Lautaro Martínez 5).
- Own goals are not attributed to any player, so team/player goal sums can sit slightly
  below the official tournament total.

## Credits

Data © StatsBomb, used under their free Open Data user agreement. Non-commercial.
