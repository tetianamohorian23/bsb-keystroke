from pathlib import Path
import json, sqlite3, threading
from collections import defaultdict
from math import sqrt

import pandas as pd
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB = Path(__file__).with_name("sessions.sqlite3")
# Number of recorded key presses per attempt for each typing mode.
# "phrase": "Every keystroke tells a unique story."   "word": "biometrics"
MODE_KEYS = {"phrase": 37, "word": 10}
DEFAULT_MODE = "phrase"  # sessions saved before modes existed are phrase sessions
CHART = Path(__file__).with_name("accuracy_chart.png")  # regenerated after every saved session
MODE_LABELS = {"phrase": "Veta", "word": "Slovo"}
_chart_lock = threading.Lock()
app = FastAPI(title="Keystroke dynamics API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Session(BaseModel):
    meta: dict = Field(default_factory=dict)
    rows: list[dict] = Field(default_factory=list)


class IdentifyRequest(BaseModel):
    rows: list[dict] = Field(default_factory=list)
    mode: str = DEFAULT_MODE


def check_mode(mode: str) -> str:
    if mode not in MODE_KEYS:
        raise HTTPException(status_code=422, detail=f"mode must be one of {sorted(MODE_KEYS)}")
    return mode


def events_dataframe(mode: str | None = None, participants: set[str] | None = None) -> pd.DataFrame:
    """Read one row per keyboard event from the session store.

    Optionally restrict to one typing mode and/or a set of participants.
    """
    with sqlite3.connect(DB) as db:
        records = db.execute(
            "SELECT participant_id, session_id, meta_json, rows_json FROM sessions ORDER BY id"
        ).fetchall()
    rows = []
    for participant_id, session_id, meta_json, rows_json in records:
        session_mode = json.loads(meta_json).get("mode", DEFAULT_MODE)
        if mode is not None and session_mode != mode:
            continue
        if participants is not None and participant_id not in participants:
            continue
        rows.extend(
            {**event, "participant_id": participant_id, "session_id": session_id, "mode": session_mode}
            for event in json.loads(rows_json)
        )
    return pd.DataFrame(rows)


def participants_by_mode() -> dict[str, set[str]]:
    with sqlite3.connect(DB) as db:
        records = db.execute("SELECT participant_id, meta_json FROM sessions").fetchall()
    result = {mode: set() for mode in MODE_KEYS}
    for participant_id, meta_json in records:
        mode = json.loads(meta_json).get("mode", DEFAULT_MODE)
        if mode in result:
            result[mode].add(participant_id)
    return result


def attempt_features(rows: list[dict], key_count: int) -> list[float]:
    frame = pd.DataFrame(rows)
    if frame.empty or "event" not in frame or "t_ms" not in frame:
        raise ValueError("rows must contain keyboard events with event and t_ms")
    frame = frame.sort_values("seq" if "seq" in frame else "t_ms")
    downs = frame[frame["event"] == "down"].copy()
    ups = frame[frame["event"] == "up"].copy()
    if len(downs) != key_count or len(ups) != key_count:
        raise ValueError(f"an attempt must contain exactly {key_count} key presses and releases")
    down_times = pd.to_numeric(downs["t_ms"], errors="coerce").to_numpy()
    up_times = pd.to_numeric(ups["t_ms"], errors="coerce").to_numpy()
    if pd.isna(down_times).any() or pd.isna(up_times).any():
        raise ValueError("event timestamps must be numeric")
    holds = []
    for _, down in downs.iterrows():
        matching = ups[(ups["code"] == down["code"]) & (ups["seq"] > down["seq"])]
        if matching.empty:
            raise ValueError("every key press must have a matching release")
        holds.append(float(matching.iloc[0]["t_ms"]) - float(down["t_ms"]))
    intervals = [float(down_times[i] - down_times[i - 1]) for i in range(1, len(down_times))]
    values = holds + intervals
    if any(value < 0 for value in values):
        raise ValueError("event timestamps must be in chronological order")
    return values


def build_templates(frame: pd.DataFrame, mode: str) -> dict[str, tuple[list[float], list[float]]]:
    """Per-participant template (mean, std) from repetitions 1-10 of one mode."""
    if frame.empty:
        return {}
    key_count = MODE_KEYS[mode]
    vectors_by_participant = defaultdict(list)
    # Each session is an independent set of repetitions.
    for (participant, _session_id, rep), group in frame.groupby(
        ["participant_id", "session_id", "rep"], sort=True
    ):
        if not 1 <= int(rep) <= 10:
            continue
        try:
            vectors_by_participant[str(participant)].append(
                attempt_features(group.to_dict("records"), key_count)
            )
        except ValueError:
            continue  # ignore invalid repetitions
    templates = {}
    for participant, vectors in vectors_by_participant.items():
        matrix = pd.DataFrame(vectors)
        templates[participant] = (
            matrix.mean().tolist(),
            matrix.std(ddof=0).replace(0, 1).tolist(),
        )
    return templates


def rank_attempt(rows: list[dict], mode: str, templates: dict | None = None) -> tuple[list[dict], bool]:
    vector = attempt_features(rows, MODE_KEYS[mode])
    if templates is None:
        templates = build_templates(events_dataframe(mode), mode)
    if not templates:
        raise LookupError(f"No valid participant templates are available for mode '{mode}'")
    distances = []
    for participant, (mean, std) in templates.items():
        distance = sqrt(sum(((value - center) / scale) ** 2 for value, center, scale in zip(vector, mean, std)))
        distances.append((participant, distance))
    distances.sort(key=lambda item: item[1])
    best_distance = distances[0][1]
    # A robust, data-relative rejection rule: a result beyond 3 standardised
    # units per feature is not assigned to a known participant.
    unknown = best_distance / sqrt(len(vector)) > 3
    weights = [1 / (distance + 1e-9) for _, distance in distances[:3]]
    total = sum(weights)
    results = [
        {"name": participant, "percent": round(weight / total * 100, 1), "distance": round(distance, 3)}
        for (participant, distance), weight in zip(distances[:3], weights)
    ]
    return results, unknown


def evaluate_templates(mode: str = DEFAULT_MODE, participants: set[str] | None = None) -> dict:
    """Top-1/top-3 accuracy for one mode (templates: reps 1-10, tests: reps 11-15)."""
    frame = events_dataframe(mode, participants)
    templates = build_templates(frame, mode)
    base = {"mode": mode, "features": 2 * MODE_KEYS[mode] - 1}
    if frame.empty or not templates:
        return {**base, "top1": 0.0, "top3": 0.0, "unknown_rate": 0.0, "avg_time_s": 0.0,
                "total": 0, "participants": 0, "confusion": {}}
    confusion = defaultdict(lambda: defaultdict(int))
    total = top1 = top3 = unknown_count = 0
    durations = []
    # Group per session: repetitions of different sessions must not be merged.
    # Templates are built once above and reused for every test attempt.
    for (actual, _session_id, rep), group in frame.groupby(
        ["participant_id", "session_id", "rep"], sort=True
    ):
        if int(rep) <= 10:
            continue
        try:
            matches, unknown = rank_attempt(group.to_dict("records"), mode, templates)
        except (ValueError, LookupError):
            continue
        predicted = "unknown" if unknown else matches[0]["name"]
        names = [match["name"] for match in matches]
        total += 1
        top1 += predicted == actual
        top3 += actual in names
        unknown_count += unknown
        durations.append(float(pd.to_numeric(group["t_ms"]).max()) / 1000)
        confusion[str(actual)][predicted] += 1
    return {
        **base,
        "top1": round(top1 / total * 100, 2) if total else 0.0,
        "top3": round(top3 / total * 100, 2) if total else 0.0,
        "unknown_rate": round(unknown_count / total * 100, 2) if total else 0.0,
        "avg_time_s": round(sum(durations) / len(durations), 2) if durations else 0.0,
        "total": total,
        "participants": len(templates),
        "confusion": {actual: dict(predictions) for actual, predictions in confusion.items()},
    }


def compare_modes() -> dict:
    """Compare modes on participants who completed every mode (fair comparison)."""
    by_mode = participants_by_mode()
    common = set.intersection(*by_mode.values())
    return {
        "common_participants": sorted(common),
        "participants_per_mode": {mode: len(names) for mode, names in by_mode.items()},
        "common": {mode: evaluate_templates(mode, common) for mode in MODE_KEYS},
        "all": {mode: evaluate_templates(mode) for mode in MODE_KEYS},
    }


def render_chart() -> None:
    """Draw top-1/top-3 accuracy for each mode into accuracy_chart.png.

    Uses participants who completed every mode when there are at least two of them
    (a fair comparison), otherwise everyone, and says so in the subtitle.
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    with _chart_lock:
        comparison = compare_modes()
        fair = len(comparison["common_participants"]) >= 2
        stats = comparison["common" if fair else "all"]
        modes = list(MODE_KEYS)
        series = [("top1", "top-1", "#ff754d"), ("top3", "top-3", "#3f9f78")]
        width = 0.36

        fig, ax = plt.subplots(figsize=(7, 4.2), dpi=150)
        for offset, (key, label, color) in zip((-width / 2 - 0.01, width / 2 + 0.01), series):
            values = [stats[mode][key] for mode in modes]
            bars = ax.bar([i + offset for i in range(len(modes))], values, width, label=label, color=color)
            for bar, value in zip(bars, values):
                ax.annotate(f"{value:.0f} %", (bar.get_x() + bar.get_width() / 2, value),
                            ha="center", va="bottom", fontsize=9, xytext=(0, 3), textcoords="offset points")
        ax.set_xticks(range(len(modes)))
        ax.set_xticklabels([
            f"{MODE_LABELS[mode]}\n{stats[mode]['total']} testovacích pokusov" for mode in modes
        ])
        ax.set_ylim(0, 125)
        ax.set_yticks([0, 25, 50, 75, 100])
        ax.set_ylabel("Presnosť (%)")
        ax.grid(axis="y", color="#dddddd", linewidth=0.6)
        ax.set_axisbelow(True)
        for side in ("top", "right"):
            ax.spines[side].set_visible(False)
        ax.legend(frameon=False, loc="upper center", ncol=2)
        subtitle = (
            f"na {len(comparison['common_participants'])} účastníkoch, ktorí písali vetu aj slovo"
            if fair
            else "zatiaľ nie sú aspoň dvaja účastníci s oboma režimami: porovnanie nie je spravodlivé"
        )
        fig.suptitle("Presnosť rozpoznávania: veta vs. slovo", fontsize=12, fontweight="bold")
        ax.set_title(subtitle, fontsize=8.5, color="#666666")
        fig.tight_layout()
        fig.savefig(CHART)
        plt.close(fig)


def refresh_chart() -> None:
    try:
        render_chart()
    except Exception as exc:  # the chart must never break saving a session
        print(f"Could not render {CHART.name}: {exc}")


def init_db():
    with sqlite3.connect(DB) as db:
        db.execute("CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, participant_id TEXT NOT NULL, session_id TEXT NOT NULL, meta_json TEXT NOT NULL, rows_json TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)")
        db.commit()
init_db()

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/sessions")
def list_sessions(limit: int = 50, offset: int = 0):
    limit = min(max(limit, 1), 100)
    offset = max(offset, 0)
    with sqlite3.connect(DB) as db:
        db.row_factory = sqlite3.Row
        total = db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        records = db.execute(
            """
            SELECT id, participant_id, session_id, created_at,
                   json_array_length(rows_json) AS event_count
            FROM sessions
            ORDER BY id DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()
    return {"total": total, "limit": limit, "offset": offset, "sessions": [dict(record) for record in records]}


@app.get("/api/sessions/{session_id}")
def get_session(session_id: int):
    with sqlite3.connect(DB) as db:
        db.row_factory = sqlite3.Row
        record = db.execute(
            "SELECT id, participant_id, session_id, meta_json, rows_json, created_at FROM sessions WHERE id = ?",
            (session_id,),
        ).fetchone()
    if record is None:
        raise HTTPException(status_code=404, detail="Session not found")
    result = dict(record)
    result["meta"] = json.loads(result.pop("meta_json"))
    result["rows"] = json.loads(result.pop("rows_json"))
    return result


@app.get("/api/stats")
def get_stats():
    with sqlite3.connect(DB) as db:
        total_sessions = db.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        total_events = db.execute(
            "SELECT COALESCE(SUM(json_array_length(rows_json)), 0) FROM sessions"
        ).fetchone()[0]
    return {"sessions": total_sessions, "events": total_events}


@app.post("/api/sessions", status_code=201)
def create_session(payload: Session, background: BackgroundTasks):
    participant = str(payload.meta.get("participant_id", "")).strip()
    session_id = str(payload.meta.get("session_id", "")).strip()
    check_mode(str(payload.meta.get("mode", DEFAULT_MODE)))
    if not participant or not session_id or len(payload.rows) == 0:
        raise HTTPException(status_code=422, detail="meta.participant_id, meta.session_id and rows are required")
    with sqlite3.connect(DB) as db:
        existing = db.execute(
            "SELECT id FROM sessions WHERE session_id = ? LIMIT 1",
            (session_id,),
        ).fetchone()
        if existing is not None:
            return {"id": existing[0], "status": "already_saved"}
        cur = db.execute("INSERT INTO sessions (participant_id, session_id, meta_json, rows_json) VALUES (?, ?, ?, ?)", (participant, session_id, json.dumps(payload.meta), json.dumps(payload.rows)))
        db.commit()
    background.add_task(refresh_chart)  # runs after the response is sent
    return {"id": cur.lastrowid, "status": "saved"}


@app.post("/api/identify")
def identify(payload: IdentifyRequest):
    try:
        matches, unknown = rank_attempt(payload.rows, check_mode(payload.mode))
    except (ValueError, LookupError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {
        "name": None if unknown else matches[0]["name"],
        "unknown": unknown,
        "matches": matches,
    }


@app.get("/api/evaluation")
def evaluation(mode: str = DEFAULT_MODE):
    return evaluate_templates(check_mode(mode))


@app.get("/api/compare")
def compare():
    return compare_modes()
