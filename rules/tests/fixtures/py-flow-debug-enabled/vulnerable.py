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
