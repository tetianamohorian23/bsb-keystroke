from pathlib import Path
import json, sqlite3
from collections import defaultdict
from math import sqrt

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB = Path(__file__).with_name("sessions.sqlite3")
KEY_COUNT = 37
app = FastAPI(title="Keystroke dynamics API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class Session(BaseModel):
    meta: dict = Field(default_factory=dict)
    rows: list[dict] = Field(default_factory=list)


class IdentifyRequest(BaseModel):
    rows: list[dict] = Field(default_factory=list)


def events_dataframe() -> pd.DataFrame:
    """Read one row per keyboard event from the session store."""
    with sqlite3.connect(DB) as db:
        records = db.execute(
            "SELECT participant_id, rows_json FROM sessions ORDER BY id"
        ).fetchall()
    rows = []
    for participant_id, rows_json in records:
        rows.extend({**event, "participant_id": participant_id} for event in json.loads(rows_json))
    return pd.DataFrame(rows)


def attempt_features(rows: list[dict]) -> list[float]:
    frame = pd.DataFrame(rows)
    if frame.empty or "event" not in frame or "t_ms" not in frame:
        raise ValueError("rows must contain keyboard events with event and t_ms")
    frame = frame.sort_values("seq" if "seq" in frame else "t_ms")
    downs = frame[frame["event"] == "down"].copy()
    ups = frame[frame["event"] == "up"].copy()
    if len(downs) != KEY_COUNT or len(ups) != KEY_COUNT:
        raise ValueError(f"an attempt must contain exactly {KEY_COUNT} key presses and releases")
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


def build_templates() -> tuple[dict[str, tuple[list[float], list[float]]], int]:
    frame = events_dataframe()

    if frame.empty:
        return {}, 0

    # Each session is an independent set of repetitions.
    # This prevents events from different sessions being mixed together.
    attempts = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for (participant, session_id, rep), group in frame.groupby(
        ["participant_id", "session_id", "rep"], sort=True
    ):
        attempts[str(participant)][str(session_id)][int(rep)].extend(
            group.to_dict("records")
        )

    templates = {}
    evaluated = 0

    for participant, sessions in attempts.items():
        vectors = []

        for session_id, by_rep in sessions.items():
            # Repetitions 1-10 are used to build the participant template.
            for rep in range(1, 11):
                if rep not in by_rep:
                    continue

                try:
                    vectors.append(attempt_features(by_rep[rep]))
                except ValueError:
                    # Ignore invalid repetitions/sessions.
                    continue

        if not vectors:
            continue

        matrix = pd.DataFrame(vectors)
        mean = matrix.mean().tolist()
        std = matrix.std(ddof=0).replace(0, 1).tolist()

        templates[participant] = (mean, std)

        # Count valid evaluation repetitions after the first 10.
        for session_id, by_rep in sessions.items():
            for rep in range(11, 16):
                if rep in by_rep:
                    try:
                        attempt_features(by_rep[rep])
                        evaluated += 1
                    except ValueError:
                        continue

    return templates, evaluated


def rank_attempt(rows: list[dict], templates: dict | None = None) -> tuple[list[dict], bool]:
    vector = attempt_features(rows)
    if templates is None:
        templates, _ = build_templates()
    if not templates:
        raise LookupError("No valid participant templates are available")
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


def evaluate_templates() -> dict:
    frame = events_dataframe()
    templates, _ = build_templates()
    confusion = defaultdict(lambda: defaultdict(int))
    total = top1 = top3 = 0
    if frame.empty or not templates:
        return {"top1": 0.0, "top3": 0.0, "total": 0, "confusion": {}}
    # Group per session: repetitions of different sessions must not be merged.
    # Templates are built once above and reused for every test attempt.
    for (actual, _session_id, rep), group in frame.groupby(
        ["participant_id", "session_id", "rep"], sort=True
    ):
        if int(rep) <= 10:
            continue
        try:
            matches, unknown = rank_attempt(group.to_dict("records"), templates)
        except (ValueError, LookupError):
            continue
        predicted = "unknown" if unknown else matches[0]["name"]
        names = [match["name"] for match in matches]
        total += 1
        top1 += predicted == actual
        top3 += actual in names
        confusion[str(actual)][predicted] += 1
    return {
        "top1": round(top1 / total * 100, 2) if total else 0.0,
        "top3": round(top3 / total * 100, 2) if total else 0.0,
        "total": total,
        "confusion": {actual: dict(predictions) for actual, predictions in confusion.items()},
    }


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
def create_session(payload: Session):
    participant = str(payload.meta.get("participant_id", "")).strip()
    session_id = str(payload.meta.get("session_id", "")).strip()
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
        return {"id": cur.lastrowid, "status": "saved"}


@app.post("/api/identify")
def identify(payload: IdentifyRequest):
    try:
        matches, unknown = rank_attempt(payload.rows)
    except (ValueError, LookupError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {
        "name": None if unknown else matches[0]["name"],
        "unknown": unknown,
        "matches": matches,
    }


@app.get("/api/evaluation")
def evaluation():
    return evaluate_templates()
