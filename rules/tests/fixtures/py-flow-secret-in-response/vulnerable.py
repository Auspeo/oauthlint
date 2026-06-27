"""Flask views that leak a server secret into the HTTP response (CWE-200)."""

import os
from os import environ, getenv

import flask
from flask import Flask, jsonify, make_response, Response

app = Flask(__name__)


@app.route("/v1")
def leak_api_key_inline():
    # Direct: a credential-named env value returned in the JSON body.
    # ruleid: auth.py.flow.secret-in-response
    return jsonify(api_key=os.environ["API_KEY"])


@app.route("/v2")
def leak_client_secret_indirect():
    # Indirection: secret assigned to a local, then returned.
    secret = os.getenv("CLIENT_SECRET")
    # ruleid: auth.py.flow.secret-in-response
    return jsonify(secret=secret)


@app.route("/v3")
def leak_token_in_dict():
    # Secret nested inside the JSON payload dict.
    # ruleid: auth.py.flow.secret-in-response
    return jsonify({"token": os.environ["ACCESS_TOKEN"]})


@app.route("/v4")
def leak_password_make_response():
    # Secret returned positionally via make_response.
    # ruleid: auth.py.flow.secret-in-response
    return make_response(os.environ["DB_PASSWORD"])


@app.route("/v5")
def leak_private_key_response():
    # Secret returned via the Response constructor.
    pem = os.getenv("PRIVATE_KEY")
    # ruleid: auth.py.flow.secret-in-response
    return Response(pem)


@app.route("/v6")
def leak_qualified_environ():
    # Qualified `from os import environ` source into flask.jsonify.
    # ruleid: auth.py.flow.secret-in-response
    return flask.jsonify(credential=environ["SERVICE_CREDENTIAL"])


@app.route("/v7")
def leak_qualified_getenv():
    # Qualified `from os import getenv` source into jsonify.
    access = getenv("AWS_ACCESS_KEY")
    # ruleid: auth.py.flow.secret-in-response
    return jsonify(access_key=access)
