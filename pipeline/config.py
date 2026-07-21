"""Shared configuration and helpers for the data pipeline.

The pipeline is competition-aware. Each (competition, season) we pull becomes a
"competition" in the site, identified by a URL-safe slug (e.g. "world-cup-2022").

Layout on disk:
    data/
      competitions.json                 # index of every competition we've built
      competitions/<slug>/
        meta.json  matches.json  players.json  teams.json  stadiums.json
        matches/<id>.json               # per-match detail (shots)
      raw/<slug>/                        # raw StatsBomb dumps (gitignored, big)
        matches.json  meta.json  events/<id>.json  lineups/<id>.json
"""
from __future__ import annotations

import json
import math
import re
from pathlib import Path

# --- Paths -------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
COMPETITIONS_DIR = DATA_DIR / "competitions"
RAW_DIR = DATA_DIR / "raw"
COMPETITIONS_INDEX = DATA_DIR / "competitions.json"

# --- Which tournaments to pull ----------------------------------------------
# Add a (competition_name, season_name) here and re-run the pipeline to grow the
# site — no code changes needed. Names must match StatsBomb's `sb.competitions()`.
COMPETITIONS: list[dict[str, str]] = [
    {"competition_name": "FIFA World Cup", "season_name": "2022"},
    {"competition_name": "Copa America", "season_name": "2024"},
]


def slugify(name: str, season: str) -> str:
    """'FIFA World Cup', '2022' -> 'world-cup-2022' (URL- and path-safe)."""
    base = f"{name} {season}".lower()
    base = base.replace("fifa ", "").replace("uefa ", "")
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    return base


# --- Per-competition path helpers -------------------------------------------
def raw_dir(slug: str) -> Path:
    return RAW_DIR / slug


def clean_dir(slug: str) -> Path:
    return COMPETITIONS_DIR / slug


def ensure_dirs(slug: str) -> None:
    for d in (
        DATA_DIR,
        COMPETITIONS_DIR,
        clean_dir(slug),
        clean_dir(slug) / "matches",
        raw_dir(slug),
        raw_dir(slug) / "events",
        raw_dir(slug) / "lineups",
    ):
        d.mkdir(parents=True, exist_ok=True)


# --- JSON I/O ----------------------------------------------------------------
def _clean(obj):
    """Recursively convert NaN/Inf floats to None so output is valid JSON."""
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean(v) for v in obj]
    return obj


def write_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(_clean(obj), f, ensure_ascii=False, indent=2, allow_nan=False)


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)
