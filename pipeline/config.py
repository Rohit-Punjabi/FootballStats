"""Shared configuration and small helpers for the data pipeline.

Everything the pipeline writes lands in the top-level `data/` folder, which the
Next.js site reads at build time. We keep raw StatsBomb dumps in `data/raw/` and
the cleaned, site-ready JSON in `data/` itself.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

# --- Paths -------------------------------------------------------------------
# config.py lives in <repo>/pipeline/, so the repo root is one level up.
REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
RAW_EVENTS_DIR = RAW_DIR / "events"
RAW_LINEUPS_DIR = RAW_DIR / "lineups"

# --- Which tournament to pull ------------------------------------------------
# StatsBomb's competition_id for the men's FIFA World Cup is 43.
# Seasons available in the free open data (as of writing): 2018, 2022.
# Leave SEASON_NAME = None to auto-pick the most recent World Cup season that
# StatsBomb actually publishes. Set it (e.g. "2022") to pin a specific edition.
COMPETITION_NAME = "FIFA World Cup"
SEASON_NAME: str | None = None


def ensure_dirs() -> None:
    """Create the data folders if they don't exist yet."""
    for d in (DATA_DIR, RAW_DIR, RAW_EVENTS_DIR, RAW_LINEUPS_DIR):
        d.mkdir(parents=True, exist_ok=True)


def _clean(obj):
    """Recursively convert NaN/Inf floats to None so output is valid JSON.

    pandas represents missing values as float('nan'), which Python's json writes
    as the literal `NaN` — not valid JSON and rejected by JSON.parse in the site.
    """
    if isinstance(obj, float):
        return None if (math.isnan(obj) or math.isinf(obj)) else obj
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_clean(v) for v in obj]
    return obj


def write_json(path: Path, obj) -> None:
    """Write `obj` as pretty, UTF-8 JSON, creating parent folders as needed."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        # allow_nan=False makes any stray NaN a hard error instead of silent bad JSON.
        json.dump(_clean(obj), f, ensure_ascii=False, indent=2, allow_nan=False)


def read_json(path: Path):
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)
