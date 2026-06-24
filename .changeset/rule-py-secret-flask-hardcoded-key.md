---
'oauthlint-rules': minor
---

Add `auth.py.secret.flask-hardcoded-key` (AUTH-PY-SECRET-001): flags a Flask
`SECRET_KEY` set to a hard-coded string literal — `app.secret_key = "..."`,
`app.config["SECRET_KEY"] = "..."`, or `app.config.update(SECRET_KEY="...")`.
A hard-coded session-signing key lets anyone forge session cookies and
impersonate any user (CWE-798, OWASP A07:2021). Values loaded from
`os.environ`, `os.urandom()`, config objects, or variables are not flagged.
