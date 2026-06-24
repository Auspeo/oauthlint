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
