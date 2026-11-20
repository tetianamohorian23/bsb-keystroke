# Backend

Install dependencies with `pip install -r requirements.txt`, then run:

```bash
uvicorn main:app --reload
```

The API stores completed sessions in `sessions.sqlite3`.

Endpoints:

- `GET /api/health` - health check.
- `POST /api/sessions` - save a completed typing session.
- `GET /api/sessions?limit=50&offset=0` - list saved sessions without the full event payload.
- `GET /api/sessions/{id}` - return metadata and all recorded keyboard events for one session.
- `GET /api/stats` - return total session and event counts.
- `POST /api/identify` - identify one attempt (`mode`: `phrase` = 37 keys, `word` = 10 keys; default `phrase`) against templates built
  from each participant's first 10 attempts. The request body is
  `{"rows": [...], "mode": "word"}` and the response contains the top three matches, their
  relative percentages, and an `unknown` flag.
- `GET /api/evaluation` - evaluate attempts 11-15 and return top-1/top-3
  accuracy plus a participant confusion matrix. Accepts `?mode=phrase|word`.
- `GET /api/compare` - compare phrase vs. word (accuracy, unknown rate, average attempt time),
  on participants who completed both modes (`common`) and on everyone (`all`).

The typing mode is stored in `meta.mode` of each session; sessions without it are treated as `phrase`.

After every newly saved session the server redraws `accuracy_chart.png` (top-1/top-3 accuracy of
phrase vs. word, on participants who completed both modes when there are at least two of them,
otherwise on everyone) in a background task, so saving is not slowed down. A failure to draw the
chart never fails the save. The chart needs `matplotlib` (in `requirements.txt`). To draw it on
demand: `python -c "import main; main.render_chart()"` from this folder.

FastAPI also provides an interactive API browser at <http://127.0.0.1:8000/docs>.

FAR/FRR analysis (offline, does not touch the database or the app): `python far_frr.py [--mode phrase|word]`
computes genuine and impostor scores of the test attempts, picks the verification threshold at the equal-error
point on attempts 11-13, checks it on attempts 14-15 and draws `far_frr_<mode>.png` and
`score_distribution_<mode>.png` into `../docs/figures`.
