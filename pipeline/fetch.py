"""Step 1 of the pipeline: download raw data from StatsBomb.

    python pipeline/fetch.py

Pulls every competition listed in config.COMPETITIONS. Resumable and retrying:
each match is skipped if its event file already exists, and network calls retry
on transient errors, so a dropped connection just means re-running continues
where it left off (full leagues are 380 matches, so this matters).

Data © StatsBomb, used under their free Open Data user agreement (non-commercial).
"""
from __future__ import annotations

import sys
import time

from statsbombpy import sb

import config

sys.stdout.reconfigure(encoding="utf-8")


def _retry(fn, tries: int = 5, base: float = 2.0):
    """Call fn(), retrying on any exception with exponential backoff."""
    for attempt in range(tries):
        try:
            return fn()
        except Exception as e:  # noqa: BLE001 - network errors vary; retry them all
            if attempt == tries - 1:
                raise
            wait = base * (2 ** attempt)
            print(f"    retry {attempt + 1}/{tries - 1} after error ({e}); waiting {wait:.0f}s",
                  flush=True)
            time.sleep(wait)


def resolve(comp_name: str, season_name: str) -> tuple[int, int]:
    comps = _retry(lambda: sb.competitions())
    row = comps[(comps["competition_name"] == comp_name) & (comps["season_name"] == season_name)]
    if row.empty:
        avail = sorted(comps[comps["competition_name"] == comp_name]["season_name"].unique())
        sys.exit(f"'{comp_name} {season_name}' not in open data. Seasons: {avail or 'none'}")
    r = row.iloc[0]
    return int(r["competition_id"]), int(r["season_id"])


def fetch_competition(comp_name: str, season_name: str) -> None:
    slug = config.slugify(comp_name, season_name)
    raw = config.raw_dir(slug)
    config.ensure_dirs(slug)
    comp_id, season_id = resolve(comp_name, season_name)

    matches = _retry(lambda: sb.matches(competition_id=comp_id, season_id=season_id))
    matches = matches.sort_values("match_date")
    config.write_json(raw / "matches.json", matches.to_dict(orient="records"))
    config.write_json(raw / "meta.json", {
        "slug": slug, "competition_id": comp_id, "season_id": season_id,
        "competition_name": comp_name, "season_name": season_name,
        "match_count": int(len(matches)),
    })

    ids = matches["match_id"].tolist()
    total = len(ids)
    fetched = skipped = 0
    print(f"{slug}: {total} matches", flush=True)
    for i, match_id in enumerate(ids, start=1):
        ev_path = raw / "events" / f"{match_id}.json"
        if ev_path.exists():
            skipped += 1
            continue
        events = _retry(lambda mid=match_id: sb.events(match_id=mid))
        config.write_json(ev_path, events.to_dict(orient="records"))
        lineups = _retry(lambda mid=match_id: sb.lineups(match_id=mid))
        config.write_json(raw / "lineups" / f"{match_id}.json",
                          {t: df.to_dict(orient="records") for t, df in lineups.items()})
        fetched += 1
        if fetched % 20 == 0:
            print(f"  [{i}/{total}] {slug}: {fetched} fetched, {skipped} already present", flush=True)
    print(f"[done] {slug}: {fetched} fetched, {skipped} already present")


def main() -> None:
    for comp in config.COMPETITIONS:
        fetch_competition(comp["competition_name"], comp["season_name"])
    print("Done. Now run: python pipeline/transform.py")


if __name__ == "__main__":
    main()
