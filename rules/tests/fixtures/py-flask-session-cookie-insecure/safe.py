import os

from flask import Flask

app = Flask(__name__)


# ok: auth.py.flask.session-cookie-insecure -- flags hardened via subscript form
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['REMEMBER_COOKIE_SECURE'] = True
app.config['REMEMBER_COOKIE_HTTPONLY'] = True


# ok: auth.py.flask.session-cookie-insecure -- driven from the environment
app.config['SESSION_COOKIE_SECURE'] = os.environ.get("PRODUCTION") == "1"


# ok: auth.py.flask.session-cookie-insecure -- update() with secure defaults
app.config.update(SESSION_COOKIE_SECURE=True, REMEMBER_COOKIE_SECURE=True)
