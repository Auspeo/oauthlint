"""Flask views that leak OAuth credentials from the request into logs."""

import logging

from flask import Flask, request

app = Flask(__name__)
logger = logging.getLogger(__name__)


@app.route("/callback")
def callback():
    # Authorization code from the callback printed directly.
    # ruleid: auth.py.flow.oauth-credential-in-log
    print(request.args.get("code"))
    return "ok"


@app.route("/exchange")
def exchange():
    # access_token assigned to a local, then logged (indirection).
    access_token = request.args.get("access_token")
    # ruleid: auth.py.flow.oauth-credential-in-log
    logger.info("token exchange complete: %s", access_token)
    return "ok"


@app.route("/introspect")
def introspect():
    # Raw Authorization header logged on failure.
    # ruleid: auth.py.flow.oauth-credential-in-log
    logging.error("auth failed for %s", request.headers.get("Authorization"))
    return "ok"


@app.route("/refresh")
def refresh():
    # refresh_token from the form body logged via logger.debug.
    refresh_token = request.form["refresh_token"]
    # ruleid: auth.py.flow.oauth-credential-in-log
    logger.debug(refresh_token)
    return "ok"
