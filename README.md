# FootballStats

A deep, browsable stats site for a single World Cup — shot maps, expected goals (xG),
and pass-level data for every match, player, team, and stadium. Built as a portfolio
project on **[StatsBomb Open Data](https://github.com/statsbomb/open-data)** (free,
non-commercial use).

Currently loaded: **FIFA World Cup 2022** (64 matches, 32 teams, 680 players).

## How it works

Two clean halves — a Python pipeline that prepares data, and a Next.js site that reads it:

```
StatsBomb  →  pipeline/ (Python)  →  data/*.json  →  web/ (Next.js SSG)  →  static site
```

The site is **fully static**: every page is pre-rendered at build time from the JSON in
`data/`, so it's fast and can be hosted for free (e.g. Vercel).

## Project layout

```
pipeline/     Python: fetch + transform StatsBomb data
  fetch.py       download raw match/event/lineup data  → data/raw/
  transform.py   aggregate into clean, site-ready JSON  → data/
  config.py      shared paths + which tournament to pull
data/         generated JSON the site reads (raw/ is gitignored, regenerable)
web/          Next.js app (App Router, TypeScript, Tailwind v4)
  src/lib/data.ts       typed loaders for the JSON
  src/components/        ShotMap, PlayerTable, CompareTool, ui primitives
  src/app/              routes: /matches /players /teams /stadiums /compare
```

## Running it

**1. Generate the data** (first run downloads ~650MB; cached after that):

```bash
cd pipeline
pip install -r requirements.txt
python fetch.py        # → data/raw/
python transform.py    # → data/*.json
```

To pull a different edition, set `SEASON_NAME` in `pipeline/config.py` (e.g. `"2018"`).
Leave it `None` to auto-pick the most recent World Cup StatsBomb publishes.

**2. Run the site:**

```bash
cd web
npm install
npm run dev      # http://localhost:3000
npm run build    # production build — prerenders every page
```

## Data notes

- **Goals/shots/xG exclude penalty-shootout kicks** (StatsBomb period 5) — those decide a
  tie separately and don't count as tournament goals. This is why the top-scorer list
  matches the official Golden Boot (Mbappé 8, Messi 7).
- Own goals are not attributed to any player, so team/player goal sums can sit slightly
  below the official tournament total.

## Credits

Data © StatsBomb, used under their free Open Data user agreement. Non-commercial.
