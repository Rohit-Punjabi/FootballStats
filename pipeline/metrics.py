"""Deep stat computations from StatsBomb event data.

Everything advanced lives here so transform.py stays readable: minutes played,
full per-player stat lines (attacking / passing / carrying / defending / aerial
/ discipline / goalkeeping), per-90 rates, percentile ranks within position
group, and per-team tactical stats.

Pitch is 120x80; the attacking team always moves toward x = 120 (goal at 120,40).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

import config

WON = {"Won", "Success", "Success In Play", "Success Out"}
SAVE_TYPES = {"Shot Saved", "Save", "Penalty Saved", "Shot Saved To Post",
              "Shot Saved Off Target", "Smother"}


def _col(df, name, default=np.nan):
    return df[name] if name in df.columns else pd.Series([default] * len(df), index=df.index)


def _xy(series):
    """Split a column of [x, y] lists into two float arrays."""
    x = series.apply(lambda v: v[0] if isinstance(v, list) and len(v) >= 2 else np.nan)
    y = series.apply(lambda v: v[1] if isinstance(v, list) and len(v) >= 2 else np.nan)
    return x.astype(float), y.astype(float)


def _dist_goal(x, y):
    return np.hypot(120 - x, 40 - y)


def _parse_clock(s):
    if not s:
        return None
    parts = str(s).split(":")
    try:
        parts = [float(p) for p in parts]
    except ValueError:
        return None
    if len(parts) == 3:
        return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if len(parts) == 2:
        return parts[0] * 60 + parts[1]
    return None


def position_group(pos: str | None) -> str:
    p = (pos or "").lower()
    if "goalkeeper" in p:
        return "GK"
    if "back" in p or "defender" in p:
        return "DEF"
    if "midfield" in p:
        return "MID"
    if any(w in p for w in ("forward", "striker", "wing", "center forward")):
        return "FWD"
    return "MID"


# --- Minutes played + main position ----------------------------------------
def compute_minutes(slug: str, events: pd.DataFrame) -> dict[int, dict]:
    """player_id -> {minutes, position, group} using lineup position stints."""
    # match end (seconds) from the last event of each match
    ev_secs = _col(events, "minute").fillna(0) * 60 + _col(events, "second").fillna(0)
    match_end = ev_secs.groupby(events["match_id"]).max().to_dict()

    mins: dict[int, float] = {}
    pos_time: dict[int, dict[str, float]] = {}
    for f in (config.raw_dir(slug) / "lineups").glob("*.json"):
        mid = int(f.stem)
        end = match_end.get(mid, 90 * 60)
        for players in config.read_json(f).values():
            for p in players:
                pid = p.get("player_id")
                if pid is None:
                    continue
                pid = int(pid)
                for stint in p.get("positions") or []:
                    frm = _parse_clock(stint.get("from"))
                    to = _parse_clock(stint.get("to"))
                    if frm is None:
                        continue
                    to = end if to is None else to
                    dur = max(0.0, to - frm) / 60.0
                    mins[pid] = mins.get(pid, 0.0) + dur
                    name = stint.get("position")
                    if name:
                        pos_time.setdefault(pid, {})[name] = pos_time.get(pid, {}).get(name, 0.0) + dur

    out = {}
    for pid, m in mins.items():
        main = max(pos_time.get(pid, {"": 0}).items(), key=lambda kv: kv[1])[0] or None
        out[pid] = {"minutes": round(m), "position": main, "group": position_group(main)}
    return out


# --- Per-player deep stats ---------------------------------------------------
def build_players(events: pd.DataFrame, nicknames: dict[int, str],
                  minutes_map: dict[int, dict]) -> list[dict]:
    ev = events
    t = _col(ev, "type")
    period = _col(ev, "period")
    in_play = period != 5

    lx, ly = _xy(_col(ev, "location"))
    px, py = _xy(_col(ev, "pass_end_location"))
    cx, cy = _xy(_col(ev, "carry_end_location"))

    d_start = _dist_goal(lx, ly)

    is_shot = (t == "Shot") & in_play
    outcome = _col(ev, "shot_outcome")
    stype = _col(ev, "shot_type")
    is_pen = is_shot & (stype == "Penalty")
    is_goal = is_shot & (outcome == "Goal")
    xg = pd.to_numeric(_col(ev, "shot_statsbomb_xg"), errors="coerce").fillna(0.0)

    is_pass = t == "Pass"
    pass_out = _col(ev, "pass_outcome")
    pass_comp = is_pass & pass_out.isna()
    assisted = _col(ev, "pass_assisted_shot_id")
    goal_ids = set(ev.loc[is_goal, "id"]) if "id" in ev.columns else set()
    into_box_end = (px >= 102) & (py >= 18) & (py <= 62)
    into_box_start = (lx >= 102) & (ly >= 18) & (ly <= 62)
    prog_pass = pass_comp & ((d_start - _dist_goal(px, py)) >= 10) & (px > lx)
    plen = pd.to_numeric(_col(ev, "pass_length"), errors="coerce")

    is_carry = t == "Carry"
    prog_carry = is_carry & ((d_start - _dist_goal(cx, cy)) >= 5) & (cx > lx)
    carry_dist = np.hypot(cx - lx, cy - ly)

    is_drib = t == "Dribble"
    drib_comp = is_drib & (_col(ev, "dribble_outcome") == "Complete")

    duel_type = _col(ev, "duel_type")
    duel_out = _col(ev, "duel_outcome")
    is_tackle = (t == "Duel") & (duel_type == "Tackle")
    aerial_won = (_col(ev, "pass_aerial_won") == True) | (_col(ev, "clearance_aerial_won") == True) | (_col(ev, "shot_aerial_won") == True)  # noqa: E712
    aerial_lost = duel_type == "Aerial Lost"

    card = _col(ev, "foul_committed_card")
    gk_type = _col(ev, "goalkeeper_type")

    # Build one contribution frame, then sum by player.
    c = pd.DataFrame({"player_id": ev["player_id"]})
    c["shots"] = is_shot.astype(int)
    c["goals"] = is_goal.astype(int)
    c["np_goals"] = (is_goal & ~is_pen).astype(int)
    c["xg"] = xg.where(is_shot, 0.0)
    c["npxg"] = xg.where(is_shot & ~is_pen, 0.0)
    c["sot"] = (is_shot & outcome.isin(["Goal", "Saved", "Saved To Post"])).astype(int)
    c["passes"] = is_pass.astype(int)
    c["passes_completed"] = pass_comp.astype(int)
    c["key_passes"] = (is_pass & assisted.notna()).astype(int)
    c["assists"] = (is_pass & assisted.isin(goal_ids)).astype(int)
    c["crosses"] = (is_pass & (_col(ev, "pass_cross") == True)).astype(int)  # noqa: E712
    c["through_balls"] = (is_pass & (_col(ev, "pass_through_ball") == True)).astype(int)  # noqa: E712
    c["long_balls"] = (pass_comp & (plen >= 30)).astype(int)
    c["passes_final_third"] = (pass_comp & (px >= 80) & (lx < 80)).astype(int)
    c["passes_into_box"] = (pass_comp & into_box_end & ~into_box_start).astype(int)
    c["prog_passes"] = prog_pass.astype(int)
    c["carries"] = is_carry.astype(int)
    c["prog_carries"] = prog_carry.astype(int)
    c["carry_distance"] = pd.Series(carry_dist, index=ev.index).where(is_carry, 0.0)
    c["dribbles"] = is_drib.astype(int)
    c["dribbles_completed"] = drib_comp.astype(int)
    c["tackles"] = is_tackle.astype(int)
    c["tackles_won"] = (is_tackle & duel_out.isin(WON)).astype(int)
    c["interceptions"] = (t == "Interception").astype(int)
    c["blocks"] = (t == "Block").astype(int)
    c["clearances"] = (t == "Clearance").astype(int)
    c["ball_recoveries"] = ((t == "Ball Recovery") & (_col(ev, "ball_recovery_recovery_failure") != True)).astype(int)  # noqa: E712
    c["pressures"] = (t == "Pressure").astype(int)
    c["aerials_won"] = aerial_won.astype(int)
    c["aerials_lost"] = aerial_lost.astype(int)
    c["fouls"] = (t == "Foul Committed").astype(int)
    c["fouls_won"] = (t == "Foul Won").astype(int)
    c["dispossessed"] = (t == "Dispossessed").astype(int)
    c["yellow_cards"] = card.isin(["Yellow Card", "Second Yellow"]).astype(int)
    c["red_cards"] = card.isin(["Red Card", "Second Yellow"]).astype(int)
    c["gk_saves"] = ((t == "Goal Keeper") & gk_type.isin(SAVE_TYPES)).astype(int)
    c["gk_conceded"] = ((t == "Goal Keeper") & (gk_type == "Goal Conceded")).astype(int)

    grp = c.groupby("player_id").sum(numeric_only=True)
    matches = ev.dropna(subset=["player_id"]).groupby("player_id")["match_id"].nunique()
    meta = ev.dropna(subset=["player_id"]).groupby("player_id").agg(
        player=("player", "first"), team=("team", "first"), team_id=("team_id", "first"))

    players = []
    for pid, row in grp.iterrows():
        pid = int(pid)
        info = minutes_map.get(pid, {})
        mins = info.get("minutes", 0)
        m = meta.loc[pid] if pid in meta.index else None
        passes = int(row["passes"])
        pc = int(row["passes_completed"])
        p = {
            "id": pid,
            "name": nicknames.get(pid, m["player"] if m is not None else str(pid)),
            "team": m["team"] if m is not None else None,
            "team_id": int(m["team_id"]) if m is not None and pd.notna(m["team_id"]) else None,
            "matches": int(matches.get(pid, 0)),
            "minutes": mins,
            "position": info.get("position"),
            "group": info.get("group", "MID"),
            # attacking
            "goals": int(row["goals"]),
            "np_goals": int(row["np_goals"]),
            "assists": int(row["assists"]),
            "shots": int(row["shots"]),
            "sot": int(row["sot"]),
            "xg": round(float(row["xg"]), 2),
            "npxg": round(float(row["npxg"]), 2),
            # passing
            "passes": passes,
            "passes_completed": pc,
            "pass_pct": round(100 * pc / passes, 1) if passes else None,
            "key_passes": int(row["key_passes"]),
            "prog_passes": int(row["prog_passes"]),
            "passes_final_third": int(row["passes_final_third"]),
            "passes_into_box": int(row["passes_into_box"]),
            "crosses": int(row["crosses"]),
            "through_balls": int(row["through_balls"]),
            "long_balls": int(row["long_balls"]),
            # carrying / dribbling
            "carries": int(row["carries"]),
            "prog_carries": int(row["prog_carries"]),
            "carry_distance": round(float(row["carry_distance"])),
            "dribbles": int(row["dribbles"]),
            "dribbles_completed": int(row["dribbles_completed"]),
            # defending
            "tackles": int(row["tackles"]),
            "tackles_won": int(row["tackles_won"]),
            "interceptions": int(row["interceptions"]),
            "blocks": int(row["blocks"]),
            "clearances": int(row["clearances"]),
            "ball_recoveries": int(row["ball_recoveries"]),
            "pressures": int(row["pressures"]),
            "aerials_won": int(row["aerials_won"]),
            "aerials_lost": int(row["aerials_lost"]),
            # discipline / misc
            "fouls": int(row["fouls"]),
            "fouls_won": int(row["fouls_won"]),
            "dispossessed": int(row["dispossessed"]),
            "yellow_cards": int(row["yellow_cards"]),
            "red_cards": int(row["red_cards"]),
            # goalkeeping
            "gk_saves": int(row["gk_saves"]),
            "gk_conceded": int(row["gk_conceded"]),
        }
        _add_per90(p)
        players.append(p)

    players.sort(key=lambda x: (-x["goals"], -x["xg"], x["name"]))
    add_percentiles(players)
    return players


# stats shown as per-90 rates (and used for percentiles / radar)
RATE_KEYS = [
    "np_goals", "npxg", "shots", "key_passes", "assists", "prog_passes",
    "passes_final_third", "passes_into_box", "prog_carries", "dribbles_completed",
    "tackles", "interceptions", "blocks", "clearances", "ball_recoveries",
    "pressures", "aerials_won",
]


def _add_per90(p: dict) -> None:
    mins = p["minutes"] or 0
    p90 = {}
    if mins >= 30:
        for k in RATE_KEYS:
            p90[k] = round(p[k] / mins * 90, 2)
        p90["tackles_interceptions"] = round((p["tackles"] + p["interceptions"]) / mins * 90, 2)
    p["per90"] = p90


# metrics shown on the percentile radar (label, per90 key or 'pass_pct')
RADAR = [
    ("Non-pen goals", "np_goals"),
    ("npxG", "npxg"),
    ("Shots", "shots"),
    ("Key passes", "key_passes"),
    ("Prog. passes", "prog_passes"),
    ("Pass %", "pass_pct"),
    ("Prog. carries", "prog_carries"),
    ("Dribbles", "dribbles_completed"),
    ("Tackles + Int", "tackles_interceptions"),
    ("Recoveries", "ball_recoveries"),
]
MIN_MINUTES = 180  # qualification threshold for percentile pool


def add_percentiles(players: list[dict]) -> None:
    """Percentile-rank each qualified player against same-group qualified peers."""
    for group in {p["group"] for p in players}:
        pool = [p for p in players if p["group"] == group and (p["minutes"] or 0) >= MIN_MINUTES]
        for label, key in RADAR:
            values = []
            for p in pool:
                values.append(_radar_value(p, key))
            arr = np.array(values, dtype=float)
            for p in pool:
                v = _radar_value(p, key)
                pct = round(float((arr <= v).sum()) / len(arr) * 100) if len(arr) else 0
                p.setdefault("percentiles", {})[key] = pct
    # mark qualification
    for p in players:
        p["qualified"] = (p["minutes"] or 0) >= MIN_MINUTES and "percentiles" in p


def _radar_value(p: dict, key: str) -> float:
    if key == "pass_pct":
        return float(p.get("pass_pct") or 0)
    return float(p.get("per90", {}).get(key, 0))


# --- Pass network (per match, per team) -------------------------------------
def match_network(g: pd.DataFrame, nicknames: dict[int, str]) -> dict:
    """{team: {nodes:[{id,name,x,y,passes}], edges:[{from,to,weight}]}}.

    Nodes are players at their average pass location; edges are completed passes
    between a pair (undirected). Keeps the 14 most-involved players and links
    made >= 3 times, which surfaces the team's passing structure.
    """
    t = _col(g, "type")
    comp = (t == "Pass") & _col(g, "pass_outcome").isna()
    lx, ly = _xy(_col(g, "location"))
    p = g[comp].copy()
    p["_x"], p["_y"] = lx[comp], ly[comp]
    rec = _col(g, "pass_recipient_id")[comp]

    out: dict = {}
    for team, tp in p.groupby("team"):
        nodes: dict[int, dict] = {}
        for pid, pp in tp.groupby("player_id"):
            pid = int(pid)
            nodes[pid] = {
                "id": pid,
                "name": nicknames.get(pid, pp["player"].iloc[0]),
                "x": round(float(pp["_x"].mean()), 1),
                "y": round(float(pp["_y"].mean()), 1),
                "passes": int(len(pp)),
            }
        edges: dict[tuple[int, int], int] = {}
        for idx, r in tp.iterrows():
            rc = rec.get(idx)
            if pd.isna(rc):
                continue
            a, b = int(r["player_id"]), int(rc)
            if a not in nodes or b not in nodes:
                continue
            key = (a, b) if a < b else (b, a)
            edges[key] = edges.get(key, 0) + 1
        top = sorted(nodes.values(), key=lambda n: -n["passes"])[:14]
        keep = {n["id"] for n in top}
        elist = [{"from": a, "to": b, "weight": w}
                 for (a, b), w in edges.items() if a in keep and b in keep and w >= 3]
        out[team] = {"nodes": top, "edges": elist}
    return out


# --- Team tactical stats -----------------------------------------------------
def build_team_tactics(events: pd.DataFrame, teams: list[dict]) -> list[dict]:
    ev = events
    t = _col(ev, "type")
    period = _col(ev, "period")
    in_play = period != 5
    team_col = ev["team"]
    pteam = _col(ev, "possession_team")
    play = _col(ev, "play_pattern")
    xg = pd.to_numeric(_col(ev, "shot_statsbomb_xg"), errors="coerce").fillna(0.0)

    is_pass = t == "Pass"
    pass_comp = is_pass & _col(ev, "pass_outcome").isna()
    is_shot = (t == "Shot") & in_play
    is_goal = is_shot & (_col(ev, "shot_outcome") == "Goal")
    setpiece = play.isin(["From Corner", "From Free Kick"])
    def_action = t.isin(["Duel", "Interception", "Pressure", "Foul Committed"])

    # possession %: share of events under each team's possession, averaged per match
    poss_rows = []
    for mid, g in ev.groupby("match_id"):
        gp = _col(g, "possession_team")
        total = gp.notna().sum()
        if not total:
            continue
        for team, cnt in gp.value_counts().items():
            poss_rows.append((team, cnt / total * 100))
    poss = pd.DataFrame(poss_rows, columns=["team", "pct"]).groupby("team")["pct"].mean().to_dict()

    # PPDA (passes allowed per defensive action) — canonical zone-based definition:
    # opponent passes in their own build-up 60% (x < 72) divided by this team's
    # tackles + interceptions + fouls in the attacking 60% (x > 48). Lower = more
    # intense pressing. (Excludes pressures and generic duels, per convention.)
    opp_passes_total: dict[str, int] = {}
    press_actions_total: dict[str, int] = {}
    for mid, g in ev.groupby("match_id"):
        gt = _col(g, "type")
        gdt = _col(g, "duel_type")
        gteam = g["team"]
        gx, _ = _xy(_col(g, "location"))
        sides = [s for s in gteam.dropna().unique()]
        if len(sides) != 2:
            continue
        build_pass = (gt == "Pass") & (gx < 72)
        press = (gx > 48) & (
            (gt == "Interception") | (gt == "Foul Committed") | ((gt == "Duel") & (gdt == "Tackle"))
        )
        passes_by = build_pass.groupby(gteam).sum()
        press_by = press.groupby(gteam).sum()
        a, b = sides
        for team, opp in ((a, b), (b, a)):
            opp_passes_total[team] = opp_passes_total.get(team, 0) + int(passes_by.get(opp, 0))
            press_actions_total[team] = press_actions_total.get(team, 0) + int(press_by.get(team, 0))

    out = []
    for tm in teams:
        name = tm["name"]
        mask = team_col == name
        passes = int((is_pass & mask).sum())
        pc = int((pass_comp & mask).sum())
        shots = int((is_shot & mask).sum())
        da = press_actions_total.get(name, 0)
        out.append({
            "id": tm["id"],
            "name": name,
            "possession": round(poss.get(name, 0), 1),
            "passes": passes,
            "passes_completed": pc,
            "pass_pct": round(100 * pc / passes, 1) if passes else None,
            "shots": shots,
            "xg": round(float(xg.where(is_shot & mask, 0.0).sum()), 2),
            "goals": int((is_goal & mask).sum()),
            "tackles": int(((t == "Duel") & (_col(ev, "duel_type") == "Tackle") & mask).sum()),
            "interceptions": int(((t == "Interception") & mask).sum()),
            "pressures": int(((t == "Pressure") & mask).sum()),
            "ppda": round(opp_passes_total.get(name, 0) / da, 1) if da else None,
            "setpiece_shots": int((is_shot & setpiece & mask).sum()),
            "setpiece_goals": int((is_goal & setpiece & mask).sum()),
            "aerials_won": int((((_col(ev, "pass_aerial_won") == True) | (_col(ev, "clearance_aerial_won") == True)) & mask).sum()),  # noqa: E712
        })
    return out
