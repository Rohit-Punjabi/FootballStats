"""Step 2 of the pipeline: turn raw StatsBomb dumps into clean, site-ready JSON.

Run this after fetch.py:

    python pipeline/transform.py

Reads everything under data/raw/ and writes the files the Next.js site consumes:

    data/meta.json          - which tournament this is
    data/teams.json         - every team
    data/players.json       - per-player tournament aggregates (goals, xG, passes...)
    data/matches.json       - one summary row per match (score, stage, stadium...)
    data/stadiums.json      - stadiums and the matches they hosted
    data/matches/<id>.json  - per-match detail incl. shot events (for shot maps)

Nothing here hits the network; it only crunches the raw files fetch.py saved.
"""
from __future__ import annotations

import sys
from collections import defaultdict

import pandas as pd

import config


def _load_all_events() -> pd.DataFrame:
    """Concatenate every match's events into one DataFrame, tagged by match_id."""
    frames = []
    files = sorted(config.RAW_EVENTS_DIR.glob("*.json"))
    if not files:
        sys.exit("No raw events found. Run `python pipeline/fetch.py` first.")
    for f in files:
        records = config.read_json(f)
        if not records:
            continue
        df = pd.DataFrame(records)
        df["match_id"] = int(f.stem)
        frames.append(df)
    return pd.concat(frames, ignore_index=True)


def _col(df: pd.DataFrame, name: str, default=None):
    """Return a column if present, else a Series of `default` (schema can vary)."""
    if name in df.columns:
        return df[name]
    return pd.Series([default] * len(df), index=df.index)


def build_matches(raw_matches: list[dict]) -> list[dict]:
    matches = []
    for m in raw_matches:
        matches.append({
            "id": int(m["match_id"]),
            "date": m.get("match_date"),
            "kickoff": m.get("kick_off"),
            "stage": m.get("competition_stage"),
            "home_team": m.get("home_team"),
            "away_team": m.get("away_team"),
            "home_score": _int_or_none(m.get("home_score")),
            "away_score": _int_or_none(m.get("away_score")),
            "stadium": m.get("stadium"),
            "referee": m.get("referee"),
            "attendance": _int_or_none(m.get("attendance")),
        })
    matches.sort(key=lambda x: (x["date"] or "", x["id"]))
    return matches


def build_teams(events: pd.DataFrame) -> list[dict]:
    teams = (
        events[["team_id", "team"]]
        .dropna()
        .drop_duplicates()
        .sort_values("team")
    )
    return [
        {"id": int(r.team_id), "name": r.team}
        for r in teams.itertuples(index=False)
    ]


def build_players(events: pd.DataFrame) -> list[dict]:
    """Per-player tournament aggregates.

    Definitions kept deliberately simple and transparent:
      goals    = Shot events with outcome 'Goal'
      assists  = passes flagged pass_goal_assist
      shots    = all Shot events
      xg       = summed StatsBomb expected goals on shots
      passes   = all Pass events; completed = passes with no pass_outcome
    """
    ev = events
    etype = _col(ev, "type")

    # Exclude penalty-shootout kicks (period 5): they are decided separately and
    # do NOT count toward a player's tournament goals/shots/xG.
    in_play = _col(ev, "period") != 5
    shots = ev[(etype == "Shot") & in_play].copy()
    passes = ev[etype == "Pass"].copy()

    # --- shot-based stats ---
    shots["_xg"] = pd.to_numeric(_col(shots, "shot_statsbomb_xg"), errors="coerce").fillna(0.0)
    shots["_goal"] = (_col(shots, "shot_outcome") == "Goal").astype(int)
    shot_stats = shots.groupby("player_id", dropna=True).agg(
        shots=("_goal", "size"),
        goals=("_goal", "sum"),
        xg=("_xg", "sum"),
    )

    # --- pass-based stats ---
    passes["_completed"] = _col(passes, "pass_outcome").isna().astype(int)
    passes["_assist"] = (_col(passes, "pass_goal_assist") == True).astype(int)  # noqa: E712
    pass_stats = passes.groupby("player_id", dropna=True).agg(
        passes=("_completed", "size"),
        passes_completed=("_completed", "sum"),
        assists=("_assist", "sum"),
    )

    # team + matches played, from any event a player appears in
    ev_players = ev.dropna(subset=["player_id"]).copy()
    meta = ev_players.groupby("player_id").agg(
        player=("player", "first"),
        team=("team", "first"),
        team_id=("team_id", "first"),
        matches=("match_id", "nunique"),
    )

    players = []
    for pid, row in meta.iterrows():
        s = shot_stats.loc[pid] if pid in shot_stats.index else None
        p = pass_stats.loc[pid] if pid in pass_stats.index else None
        goals = int(s["goals"]) if s is not None else 0
        shots_n = int(s["shots"]) if s is not None else 0
        xg = round(float(s["xg"]), 2) if s is not None else 0.0
        passes_n = int(p["passes"]) if p is not None else 0
        passes_c = int(p["passes_completed"]) if p is not None else 0
        assists = int(p["assists"]) if p is not None else 0
        players.append({
            "id": int(pid),
            "name": row["player"],
            "team": row["team"],
            "team_id": _int_or_none(row["team_id"]),
            "matches": int(row["matches"]),
            "goals": goals,
            "assists": assists,
            "shots": shots_n,
            "xg": xg,
            "passes": passes_n,
            "passes_completed": passes_c,
            "pass_pct": round(100 * passes_c / passes_n, 1) if passes_n else None,
        })
    players.sort(key=lambda x: (-x["goals"], -x["xg"], x["name"]))
    return players


def build_stadiums(matches: list[dict]) -> list[dict]:
    by_stadium: dict[str, list[int]] = defaultdict(list)
    for m in matches:
        if m["stadium"]:
            by_stadium[m["stadium"]].append(m["id"])
    stadiums = [
        {"name": name, "match_count": len(ids), "match_ids": sorted(ids)}
        for name, ids in by_stadium.items()
    ]
    stadiums.sort(key=lambda x: (-x["match_count"], x["name"]))
    return stadiums


def build_match_details(events: pd.DataFrame) -> None:
    """Write per-match shot events (location, xG, outcome) for shot maps."""
    etype = _col(events, "type")
    in_play = _col(events, "period") != 5  # drop shootout kicks from shot maps
    shots = events[(etype == "Shot") & in_play].copy()
    for match_id, g in shots.groupby("match_id"):
        shot_list = []
        for _, r in g.iterrows():
            loc = r.get("location")
            shot_list.append({
                "player": r.get("player"),
                "team": r.get("team"),
                "minute": _int_or_none(r.get("minute")),
                "x": loc[0] if isinstance(loc, list) and len(loc) >= 2 else None,
                "y": loc[1] if isinstance(loc, list) and len(loc) >= 2 else None,
                "xg": round(float(r.get("shot_statsbomb_xg")), 3)
                    if pd.notna(r.get("shot_statsbomb_xg")) else None,
                "outcome": r.get("shot_outcome"),
                "body_part": r.get("shot_body_part"),
            })
        config.write_json(config.DATA_DIR / "matches" / f"{int(match_id)}.json",
                          {"match_id": int(match_id), "shots": shot_list})


def _int_or_none(v):
    try:
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return None
        return int(v)
    except (TypeError, ValueError):
        return None


def main() -> None:
    config.ensure_dirs()

    meta = config.read_json(config.RAW_DIR / "meta.json")
    raw_matches = config.read_json(config.RAW_DIR / "matches.json")
    print(f"Transforming {meta['competition_name']} {meta['season_name']} "
          f"({len(raw_matches)} matches)")

    events = _load_all_events()
    print(f"  loaded {len(events):,} events")

    matches = build_matches(raw_matches)
    teams = build_teams(events)
    players = build_players(events)
    stadiums = build_stadiums(matches)

    config.write_json(config.DATA_DIR / "meta.json", meta)
    config.write_json(config.DATA_DIR / "matches.json", matches)
    config.write_json(config.DATA_DIR / "teams.json", teams)
    config.write_json(config.DATA_DIR / "players.json", players)
    config.write_json(config.DATA_DIR / "stadiums.json", stadiums)
    build_match_details(events)

    print(f"  wrote {len(teams)} teams, {len(players)} players, "
          f"{len(matches)} matches, {len(stadiums)} stadiums")
    top = players[0] if players else None
    if top:
        print(f"  sanity check - top scorer: {top['name']} ({top['team']}) "
              f"{top['goals']} goals, {top['xg']} xG")
    print("Done. Clean JSON written to data/. Build the site with: cd web && npm run dev")


if __name__ == "__main__":
    main()
