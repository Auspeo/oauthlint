from flask import Flask
from flask_cors import CORS, cross_origin

app = Flask(__name__)


# ruleid: auth.py.cors.allow-all
CORS(app, origins="*", supports_credentials=True)


# ruleid: auth.py.cors.allow-all
CORS(app, supports_credentials=True, origins="*")


# ruleid: auth.py.cors.allow-all
CORS(app, origins=["*"], supports_credentials=True)


# Credentials on, no `origins` argument → Flask-CORS defaults to the wildcard.
# ruleid: auth.py.cors.allow-all
CORS(app, supports_credentials=True)


@app.route("/wildcard")
# ruleid: auth.py.cors.allow-all
@cross_origin(origins="*", supports_credentials=True)
def wildcard_view():
    return "data"


@app.route("/default")
# ruleid: auth.py.cors.allow-all
@cross_origin(supports_credentials=True)
def default_view():
    return "data"
