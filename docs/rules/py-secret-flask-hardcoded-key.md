# `auth.py.secret.flask-hardcoded-key`

> The Flask `SECRET_KEY` (used to sign session cookies and CSRF tokens) is

| | |
|---|---|
| **OAuthLint id** | `AUTH-PY-SECRET-001` |
| **Severity** | ERROR |
| **LLM prevalence** | HIGH |
| **CWE** | [CWE-798](https://cwe.mitre.org/data/definitions/798.html) |
| **OWASP** | A07:2021 |
| **Languages** | python |
| **Technologies** | flask |

## Why this matters

The Flask `SECRET_KEY` (used to sign session cookies and CSRF tokens) is
set to a hard-coded string literal. Anyone who reads the source — or a
leaked repo — can forge session cookies and impersonate any user, a
complete authentication bypass (CWE-798).

Load the secret from the environment or a secret manager instead, e.g.
`app.secret_key = os.environ["SECRET_KEY"]`, and generate it with a CSPRNG
such as `secrets.token_hex(32)` / `os.urandom(32)`. Never commit the value.

## ❌ Vulnerable

```python
from flask import Flask

app = Flask(__name__)


def configure_secret_key():
    # ruleid: auth.py.secret.flask-hardcoded-key
    app.secret_key = "super-secret-do-not-share"


def configure_config_item():
    # ruleid: auth.py.secret.flask-hardcoded-key
    app.config["SECRET_KEY"] = "another-hardcoded-key"


def configure_via_update():
    # ruleid: auth.py.secret.flask-hardcoded-key
    app.config.update(DEBUG=True, SECRET_KEY="yet-another-key", TESTING=False)


def configure_renamed_app():
    server = Flask(__name__)
    # ruleid: auth.py.secret.flask-hardcoded-key
    server.secret_key = "keyboard cat"
```

## ✅ Safe

```python
import os
import secrets

from flask import Flask

app = Flask(__name__)


def from_environ():
    # ok: auth.py.secret.flask-hardcoded-key
    app.secret_key = os.environ["SECRET_KEY"]


def from_environ_config():
    # ok: auth.py.secret.flask-hardcoded-key
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY")


def from_urandom():
    # ok: auth.py.secret.flask-hardcoded-key
    app.config["SECRET_KEY"] = os.urandom(24)


def from_csprng():
    # ok: auth.py.secret.flask-hardcoded-key
    app.secret_key = secrets.token_hex(32)


def from_variable():
    # ok: auth.py.secret.flask-hardcoded-key
    key = os.environ["SECRET_KEY"]
    app.secret_key = key


def from_config_object(config):
    # ok: auth.py.secret.flask-hardcoded-key
    app.secret_key = config.SECRET_KEY


def update_from_env():
    # ok: auth.py.secret.flask-hardcoded-key
    app.config.update(DEBUG=False, SECRET_KEY=os.environ["SECRET_KEY"])
```

## Suppressing this rule (when you really must)

```python
# oauthlint-disable-next-line auth.py.secret.flask-hardcoded-key -- <reason>
this_line_would_otherwise_trigger_the_rule()
```

Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.

## References

- https://flask.palletsprojects.com/en/stable/config/#SECRET_KEY
- https://cwe.mitre.org/data/definitions/798.html

<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->
