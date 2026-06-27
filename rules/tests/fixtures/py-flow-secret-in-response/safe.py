"""Responses that do NOT leak a secret — must produce zero findings."""

import os
from os import getenv

from flask import Flask, jsonify, make_response, Response

app = Flask(__name__)


def redact(value):
    # Masks all but the first/last character.
    if not value:
        return value
    return value[0] + "***" + value[-1]


@app.route("/s1")
def public_env_value():
    # Public-by-convention name: not a secret, prefixes are excluded.
    return jsonify(url=os.environ["NEXT_PUBLIC_API_URL"])


@app.route("/s2")
def public_prefixed_key():
    # PUBLIC_ prefix is excluded even though it contains "KEY".
    return jsonify(api_key=os.environ["PUBLIC_API_KEY"])


@app.route("/s3")
def non_secret_env_value():
    # Operational config, not a credential.
    return jsonify(port=os.getenv("PORT"))


@app.route("/s4")
def constant_value():
    # A literal constant, nothing from the environment.
    return jsonify(status="ok")


@app.route("/s5")
def redacted_secret():
    # Secret is masked before it reaches the response — taint cleared.
    return jsonify(api_key=redact(os.environ["API_KEY"]))


@app.route("/s6")
def secret_kept_server_side():
    # Secret is used to authenticate upstream, never returned to the client.
    token = getenv("UPSTREAM_API_TOKEN")
    _ = {"Authorization": f"Bearer {token}"}
    return make_response("done")


@app.route("/s7")
def vite_public_config():
    # VITE_ prefix is excluded.
    return Response(os.getenv("VITE_PUBLIC_TOKEN"))
