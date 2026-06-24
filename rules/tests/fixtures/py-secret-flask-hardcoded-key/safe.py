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
