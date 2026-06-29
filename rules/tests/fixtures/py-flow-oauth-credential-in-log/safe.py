"""Flask views that log safely — no OAuth credential reaches a log sink."""

import logging

from flask import Flask, request

app = Flask(__name__)
logger = logging.getLogger(__name__)


def redact(value):
    """Return only a short, non-sensitive prefix of a credential."""
    return (value[:4] + "...") if value else value


@app.route("/ping")
def ping():
    # Constant status message — no request data, no taint.
    print("oauth callback received")
    return "ok"


@app.route("/list")
def list_items():
    # Benign request field (pagination) — not a credential source.
    logger.info("listing page %s", request.args.get("page"))
    return "ok"


@app.route("/callback")
def callback():
    # Sanitized: the authorization code is redacted before logging.
    code = request.args.get("code")
    logger.info("code prefix %s", redact(code))
    return "ok"
