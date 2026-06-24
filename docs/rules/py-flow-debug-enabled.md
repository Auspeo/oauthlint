# `auth.py.flow.debug-enabled`

> Debug mode is hard-coded to `True`. In production this leaks the

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-FLOW-003` |
| **Severity** | WARNING |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-489](https://cwe.mitre.org/data/definitions/489.html) |
| **OWASP** | A05:2021 |
| **Languages** | python |
| **Technologies** | flask, django |

## Why this matters

Debug mode is hard-coded to `True`. In production this leaks the
`SECRET_KEY`, environment variables, and full tracebacks, and Flask's
Werkzeug debugger additionally exposes an interactive console that
allows remote code execution.

Never enable debug mode in production. Drive it from an environment
variable that defaults to off, e.g.
`debug=os.environ.get("FLASK_DEBUG") == "1"` (Flask) or
`DEBUG = os.environ.get("DJANGO_DEBUG") == "1"` (Django).

## ❌ Vulnerable

```python
from flask import Flask

app = Flask(__name__)


def serve():
    # ruleid: auth.py.flow.debug-enabled
    app.run(host="0.0.0.0", debug=True)


def configure():
    # ruleid: auth.py.flow.debug-enabled
    app.config["DEBUG"] = True


def configure_attr():
    # ruleid: auth.py.flow.debug-enabled
    app.debug = True


# ruleid: auth.py.flow.debug-enabled
DEBUG = True
```

## ✅ Safe

```python
import os

from flask import Flask

app = Flask(__name__)


# ok: auth.py.flow.debug-enabled -- debug not enabled at all
def serve():
    app.run(host="127.0.0.1")


# ok: auth.py.flow.debug-enabled -- explicitly disabled
def serve_no_debug():
    app.run(host="127.0.0.1", debug=False)


# ok: auth.py.flow.debug-enabled -- driven by an environment variable
def serve_env():
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")


# ok: auth.py.flow.debug-enabled -- disabled in production settings
DEBUG = False

# ok: auth.py.flow.debug-enabled -- read from the environment, defaults off
DJANGO_DEBUG = os.environ.get("DJANGO_DEBUG") == "1"
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.flow.debug-enabled -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://flask.palletsprojects.com/en/stable/config/#DEBUG
- https://docs.djangoproject.com/en/stable/ref/settings/#debug
- https://cwe.mitre.org/data/definitions/489.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
