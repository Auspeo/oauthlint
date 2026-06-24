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
