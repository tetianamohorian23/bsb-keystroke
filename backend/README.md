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
- `POST /api/identify` - identify one 37-key attempt against templates built
  from each participant's first 10 attempts. The request body is
  `{"rows": [...]}` and the response contains the top three matches, their
  relative percentages, and an `unknown` flag.
- `GET /api/evaluation` - evaluate attempts 11-15 and return top-1/top-3
  accuracy plus a participant confusion matrix.

FastAPI also provides an interactive API browser at <http://127.0.0.1:8000/docs>.
