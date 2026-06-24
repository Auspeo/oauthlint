---
'oauthlint-rules': minor
---

Add `auth.py.flow.debug-enabled` (AUTH-PY-FLOW-003, CWE-489). Flags debug mode
hard-coded to `True` in Flask and Django apps — `app.run(..., debug=True)`,
`app.config["DEBUG"] = True`, `app.debug = True`, and Django's `DEBUG = True`
setting. In production this leaks the `SECRET_KEY`, environment variables, and
tracebacks, and Flask's Werkzeug debugger exposes an interactive console
(remote code execution). Drive debug from an environment variable that defaults
to off instead. Matches only the literal `True`; `debug=False`, `DEBUG = False`,
and `os.environ.get(...)` / `config(...)` assignments are not flagged.
