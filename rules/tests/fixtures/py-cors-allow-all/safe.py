from flask import Flask
from flask_cors import CORS, cross_origin

app = Flask(__name__)


# ok: auth.py.cors.allow-all -- credentials with an explicit allow-list
CORS(app, origins=["https://app.example.com"], supports_credentials=True)


# ok: auth.py.cors.allow-all -- explicit single origin with credentials
CORS(app, origins="https://app.example.com", supports_credentials=True)


# ok: auth.py.cors.allow-all -- wildcard origin but no credentials (public API)
CORS(app, origins="*")


# ok: auth.py.cors.allow-all -- default config, no credentials enabled
CORS(app)


@app.route("/authed")
# ok: auth.py.cors.allow-all -- explicit allow-list on the decorator
@cross_origin(origins=["https://app.example.com"], supports_credentials=True)
def authed_view():
    return "data"
