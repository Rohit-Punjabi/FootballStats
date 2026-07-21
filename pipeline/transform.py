"""Step 2 of the pipeline: turn raw StatsBomb dumps into clean, site-ready JSON.

    python pipeline/transform.py

Processes every competition found under data/raw/<slug>/ and writes, per slug:

    data/competitions/<slug>/meta.json      tournament summary + champion + golden boot
    data/competitions/<slug>/matches.json   one row per match
    data/competitions/<slug>/players.json   per-player aggregates
    data/competitions/<slug>/teams.json     every team
    data/competitions/<slug>/stadiums.json  venues + matches hosted
    data/competitions/<slug>/matches/<id>.json   per-match shots (for shot maps)

and a top-level data/competitions.json index of all of them.
"""
from __future__ import annotations

import sys
from collections import defaultdict

import pandas as pd

import config

# Force UTF-8 stdout so accented player names don't crash Windows' cp1252 console.
sys.stdout.reconfigure(encoding="utf-8")


def load_nicknames(slug: str) -> dict[int, str]:
    """player_id -> common name from StatsBomb lineups (e.g. 'Lionel Messi').

    StatsBomb stores the full legal name in events ('Lionel Andrés Messi
    Cuccittini') but a familiar 'player_nickname' in the lineups. We prefer the
    nickname wherever it exists.
    """
    names: dict[int, str] = {}
    for f in (config.raw_dir(slug) / "lineups").glob("*.json"):
        for players in config.read_json(f).values():
            for p in players:
                pid = p.get("player_id")
                nick = p.get("player_nickname")
                if pid is not None and isinstance(nick, str) and nick.strip():
                    names[int(pid)] = nick.strip()
    return names


def _load_events(slug: str) -> pd.DataFrame:
    frames = []
    for f in sorted((config.raw_dir(slug) / "events").glob("*.json")):
        records = config.read_json(f)
        if not records:
            continue
        df = pd.DataFrame(records)
        df["match_id"] = int(f.stem)
        frames.append(df)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


def _col(df: pd.DataFrame, name: str, default=None):
    return df[name] if name in df.columns else pd.Series([default] * len(df), index=df.index)


def _int_or_none(v):
    try:
        if v is None or (isinstance(v, float) and pd.isna(v)):
            return None
        return int(v)
    except (TypeError, ValueError):
        return None


def build_matches(raw_matches: list[dict]) -> list[dict]:
    matches = [{
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
    } for m in raw_matches]
    matches.sort(key=lambda x: (x["date"] or "", x["id"]))
    return matches


def build_teams(events: pd.DataFrame) -> list[dict]:
    teams = events[["team_id", "team"]].dropna().drop_duplicates().sort_values("team")
    return [{"id": int(r.team_id), "name": r.team} for r in teams.itertuples(index=False)]


def build_players(events: pd.DataFrame, nicknames: dict[int, str]) -> list[dict]:
    etype = _col(events, "type")
    in_play = _col(events, "period") != 5  # exclude penalty-shootout kicks
    shots = events[(etype == "Shot") & in_play].copy()
    passes = events[etype == "Pass"].copy()

    shots["_xg"] = pd.to_numeric(_col(shots, "shot_statsbomb_xg"), errors="coerce").fillna(0.0)
    shots["_goal"] = (_col(shots, "shot_outcome") == "Goal").astype(int)
    shot_stats = shots.groupby("player_id", dropna=True).agg(
        shots=("_goal", "size"), goals=("_goal", "sum"), xg=("_xg", "sum"))

    passes["_completed"] = _col(passes, "pass_outcome").isna().astype(int)
    passes["_assist"] = (_col(passes, "pass_goal_assist") == True).astype(int)  # noqa: E712
    pass_stats = passes.groupby("player_id", dropna=True).agg(
        passes=("_completed", "size"),
        passes_completed=("_completed", "sum"),
        assists=("_assist", "sum"))

    meta = events.dropna(subset=["player_id"]).groupby("player_id").agg(
        player=("player", "first"), team=("team", "first"),
        team_id=("team_id", "first"), matches=("match_id", "nunique"))

    players = []
    for pid, row in meta.iterrows():
        s = shot_stats.loc[pid] if pid in shot_stats.index else None
        p = pass_stats.loc[pid] if pid in pass_stats.index else None
        passes_n = int(p["passes"]) if p is not None else 0
        passes_c = int(p["passes_completed"]) if p is not None else 0
        players.append({
            "id": int(pid),
            "name": nicknames.get(int(pid), row["player"]),
            "team": row["team"],
            "team_id": _int_or_none(row["team_id"]),
            "matches": int(row["matches"]),
            "goals": int(s["goals"]) if s is not None else 0,
            "assists": int(p["assists"]) if p is not None else 0,
            "shots": int(s["shots"]) if s is not None else 0,
            "xg": round(float(s["xg"]), 2) if s is not None else 0.0,
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
    stadiums = [{"name": n, "match_count": len(ids), "match_ids": sorted(ids)}
                for n, ids in by_stadium.items()]
    stadiums.sort(key=lambda x: (-x["match_count"], x["name"]))
    return stadiums


def build_match_details(slug: str, events: pd.DataFrame, nicknames: dict[int, str]) -> None:
    etype = _col(events, "type")
    in_play = _col(events, "period") != 5
    shots = events[(etype == "Shot") & in_play].copy()
    for match_id, g in shots.groupby("match_id"):
        shot_list = []
        for _, r in g.iterrows():
            loc = r.get("location")
            pid = r.get("player_id")
            name = nicknames.get(int(pid), r.get("player")) if pd.notna(pid) else r.get("player")
            shot_list.append({
                "player": name, "team": r.get("team"),
                "minute": _int_or_none(r.get("minute")),
                "x": loc[0] if isinstance(loc, list) and len(loc) >= 2 else None,
                "y": loc[1] if isinstance(loc, list) and len(loc) >= 2 else None,
                "xg": round(float(r.get("shot_statsbomb_xg")), 3)
                    if pd.notna(r.get("shot_statsbomb_xg")) else None,
                "outcome": r.get("shot_outcome"),
                "body_part": r.get("shot_body_part"),
            })
        config.write_json(config.clean_dir(slug) / "matches" / f"{int(match_id)}.json",
                          {"match_id": int(match_id), "shots": shot_list})


def find_champion(matches: list[dict], events: pd.DataFrame) -> str | None:
    """Winner of the Final; breaks a draw by penalty-shootout goals (period 5)."""
    finals = [m for m in matches if (m["stage"] or "").lower() == "final"]
    if not finals:
        return None
    f = finals[-1]
    hs, as_ = f["home_score"] or 0, f["away_score"] or 0
    if hs != as_:
        return f["home_team"] if hs > as_ else f["away_team"]
    # drawn after extra time → count shootout goals from that match's events
    ev = events[events["match_id"] == f["id"]]
    so = ev[(_col(ev, "period") == 5) & (_col(ev, "type") == "Shot")
            & (_col(ev, "shot_outcome") == "Goal")]
    if so.empty:
        return None
    counts = so["team"].value_counts()
    return counts.index[0] if len(counts) else None


def process_competition(slug: str) -> dict:
    meta = config.read_json(config.raw_dir(slug) / "meta.json")
    raw_matches = config.read_json(config.raw_dir(slug) / "matches.json")
    events = _load_events(slug)
    nicknames = load_nicknames(slug)
    print(f"  {slug}: {len(events):,} events, {len(nicknames)} nicknames", flush=True)

    matches = build_matches(raw_matches)
    teams = build_teams(events)
    players = build_players(events, nicknames)
    stadiums = build_stadiums(matches)
    build_match_details(slug, events, nicknames)

    champion = find_champion(matches, events)
    top = players[0] if players else None
    final = next((m for m in matches if (m["stage"] or "").lower() == "final"), None)

    out = config.clean_dir(slug)
    config.write_json(out / "matches.json", matches)
    config.write_json(out / "teams.json", teams)
    config.write_json(out / "players.json", players)
    config.write_json(out / "stadiums.json", stadiums)

    summary = {
        **meta,
        "slug": slug,  # authoritative; older raw meta.json may predate this field
        "team_count": len(teams),
        "player_count": len(players),
        "goal_count": sum(p["goals"] for p in players),
        "champion": champion,
        "final_match_id": final["id"] if final else None,
        "top_scorer": {"id": top["id"], "name": top["name"], "team": top["team"],
                       "goals": top["goals"]} if top else None,
    }
    config.write_json(out / "meta.json", summary)
    print(f"    champion: {champion} | golden boot: "
          f"{top['name'] if top else '-'} ({top['goals'] if top else 0})")
    return summary


def main() -> None:
    slugs = [config.slugify(c["competition_name"], c["season_name"])
             for c in config.COMPETITIONS]
    # only process what's actually been fetched
    slugs = [s for s in slugs if (config.raw_dir(s) / "meta.json").exists()]

    index = []
    print(f"Transforming {len(slugs)} competition(s)")
    for slug in slugs:
        index.append(process_competition(slug))

    # newest season first for display
    index.sort(key=lambda x: x["season_name"], reverse=True)
    config.write_json(config.COMPETITIONS_INDEX, index)
    print(f"Done. Wrote {len(index)} competitions → data/competitions.json")


if __name__ == "__main__":
    main()
