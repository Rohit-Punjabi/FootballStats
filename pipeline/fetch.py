"""Step 1 of the pipeline: download raw World Cup data from StatsBomb.

Run this first:

    python pipeline/fetch.py

It figures out which World Cup edition to pull (see config.SEASON_NAME),
downloads the match list plus every match's events and lineups, and saves the
raw JSON under data/raw/. Nothing here is aggregated yet — transform.py does that.

Data © StatsBomb, used under their free Open Data user agreement (non-commercial).
"""
from __future__ import annotations

import sys

from statsbombpy import sb

import config


def pick_season() -> tuple[int, int, str, str]:
    """Return (competition_id, season_id, competition_name, season_name).

    Finds the FIFA World Cup and either the pinned season (config.SEASON_NAME)
    or the most recent one StatsBomb publishes.
    """
    comps = sb.competitions()
    wc = comps[comps["competition_name"] == config.COMPETITION_NAME]
    if wc.empty:
        sys.exit(
            f"Could not find '{config.COMPETITION_NAME}' in StatsBomb open data. "
            f"Available competitions:\n{sorted(comps['competition_name'].unique())}"
        )

    if config.SEASON_NAME is not None:
        row = wc[wc["season_name"] == config.SEASON_NAME]
        if row.empty:
            sys.exit(
                f"Season '{config.SEASON_NAME}' not available for the World Cup. "
                f"Available: {sorted(wc['season_name'].unique())}"
            )
        row = row.iloc[0]
    else:
        # Season names are years like "2018"/"2022"; pick the latest.
        row = wc.sort_values("season_name").iloc[-1]

    return (
        int(row["competition_id"]),
        int(row["season_id"]),
        str(row["competition_name"]),
        str(row["season_name"]),
    )


def main() -> None:
    config.ensure_dirs()

    comp_id, season_id, comp_name, season_name = pick_season()
    print(f"Fetching {comp_name} {season_name} "
          f"(competition_id={comp_id}, season_id={season_id})")

    # Match list for the tournament.
    matches = sb.matches(competition_id=comp_id, season_id=season_id)
    matches = matches.sort_values("match_date")
    config.write_json(
        config.RAW_DIR / "matches.json",
        matches.to_dict(orient="records"),
    )
    # Record which edition this dump is, so the site can label itself.
    config.write_json(
        config.RAW_DIR / "meta.json",
        {
            "competition_id": comp_id,
            "season_id": season_id,
            "competition_name": comp_name,
            "season_name": season_name,
            "match_count": int(len(matches)),
        },
    )
    print(f"  {len(matches)} matches")

    # Events + lineups per match. statsbombpy caches HTTP responses, so re-runs
    # are fast; the first run downloads ~64 matches and can take a few minutes.
    for i, match_id in enumerate(matches["match_id"].tolist(), start=1):
        print(f"  [{i}/{len(matches)}] match {match_id}: events + lineups", flush=True)

        events = sb.events(match_id=match_id)
        config.write_json(
            config.RAW_EVENTS_DIR / f"{match_id}.json",
            events.to_dict(orient="records"),
        )

        # sb.lineups returns {team_name: DataFrame}; flatten to a plain dict.
        lineups = sb.lineups(match_id=match_id)
        config.write_json(
            config.RAW_LINEUPS_DIR / f"{match_id}.json",
            {team: df.to_dict(orient="records") for team, df in lineups.items()},
        )

    print("Done. Raw data written to data/raw/. Now run: python pipeline/transform.py")


if __name__ == "__main__":
    main()
