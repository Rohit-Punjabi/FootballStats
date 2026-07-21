"""Step 1 of the pipeline: download raw data from StatsBomb.

    python pipeline/fetch.py

Pulls every competition listed in config.COMPETITIONS. For each one it saves the
match list plus every match's events and lineups under data/raw/<slug>/.
Already-downloaded competitions are skipped (delete the folder to re-fetch).

Data © StatsBomb, used under their free Open Data user agreement (non-commercial).
"""
from __future__ import annotations

import sys

from statsbombpy import sb

import config

# Player/competition names contain accents; force UTF-8 so prints never crash
# on the Windows console (cp1252).
sys.stdout.reconfigure(encoding="utf-8")


def resolve(comp_name: str, season_name: str) -> tuple[int, int]:
    """Look up (competition_id, season_id) for a competition + season."""
    comps = sb.competitions()
    row = comps[
        (comps["competition_name"] == comp_name)
        & (comps["season_name"] == season_name)
    ]
    if row.empty:
        avail = sorted(
            comps[comps["competition_name"] == comp_name]["season_name"].unique()
        )
        sys.exit(
            f"'{comp_name} {season_name}' not in StatsBomb open data. "
            f"Seasons for '{comp_name}': {avail or 'competition not found'}"
        )
    r = row.iloc[0]
    return int(r["competition_id"]), int(r["season_id"])


def fetch_competition(comp_name: str, season_name: str) -> None:
    slug = config.slugify(comp_name, season_name)
    raw = config.raw_dir(slug)

    if (raw / "meta.json").exists():
        print(f"[ok] {slug}: already downloaded (skipping)")
        return

    config.ensure_dirs(slug)
    comp_id, season_id = resolve(comp_name, season_name)
    print(f"Fetching {comp_name} {season_name} -> {slug} "
          f"(competition_id={comp_id}, season_id={season_id})")

    matches = sb.matches(competition_id=comp_id, season_id=season_id)
    matches = matches.sort_values("match_date")
    config.write_json(raw / "matches.json", matches.to_dict(orient="records"))
    config.write_json(raw / "meta.json", {
        "slug": slug,
        "competition_id": comp_id,
        "season_id": season_id,
        "competition_name": comp_name,
        "season_name": season_name,
        "match_count": int(len(matches)),
    })
    print(f"  {len(matches)} matches")

    for i, match_id in enumerate(matches["match_id"].tolist(), start=1):
        print(f"  [{i}/{len(matches)}] match {match_id}", flush=True)
        events = sb.events(match_id=match_id)
        config.write_json(raw / "events" / f"{match_id}.json",
                          events.to_dict(orient="records"))
        lineups = sb.lineups(match_id=match_id)
        config.write_json(raw / "lineups" / f"{match_id}.json",
                          {t: df.to_dict(orient="records") for t, df in lineups.items()})


def main() -> None:
    for comp in config.COMPETITIONS:
        fetch_competition(comp["competition_name"], comp["season_name"])
    print("Done. Now run: python pipeline/transform.py")


if __name__ == "__main__":
    main()
