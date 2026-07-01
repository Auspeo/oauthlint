from flask import Flask

app = Flask(__name__)


# Subscript form on app.config — missed by the bare-assignment rule.
# ruleid: auth.py.flask.session-cookie-insecure
app.config['SESSION_COOKIE_SECURE'] = False

# ruleid: auth.py.flask.session-cookie-insecure
app.config['SESSION_COOKIE_HTTPONLY'] = False

# ruleid: auth.py.flask.session-cookie-insecure
app.config['REMEMBER_COOKIE_SECURE'] = False

# ruleid: auth.py.flask.session-cookie-insecure
app.config['REMEMBER_COOKIE_HTTPONLY'] = False


# Keyword form via config.update(...).
# ruleid: auth.py.flask.session-cookie-insecure
app.config.update(SESSION_COOKIE_SECURE=False, SESSION_COOKIE_SAMESITE="Lax")

# ruleid: auth.py.flask.session-cookie-insecure
app.config.update(REMEMBER_COOKIE_SECURE=False)
