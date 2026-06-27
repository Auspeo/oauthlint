"""Flask views with SSRF: untrusted request data reaches an outbound HTTP request."""

import urllib.request

import flask
import httpx
import requests
from flask import Flask, request

app = Flask(__name__)


@app.route("/f1")
def fetch_query_get():
    # Direct: request.args.get('url') flows straight into requests.get().
    # ruleid: auth.py.flow.ssrf
    return requests.get(request.args.get("url")).text


@app.route("/f2")
def fetch_json_indirect():
    # Indirection: tainted value assigned to a local, then fetched.
    target = request.json["endpoint"]
    # ruleid: auth.py.flow.ssrf
    return httpx.get(target).text


@app.route("/f3")
def fetch_form_post():
    dest = request.form.get("callback")
    # ruleid: auth.py.flow.ssrf
    return requests.post(dest, json={"ok": True}).text


@app.route("/f4")
def fetch_values_urlopen():
    # Tainted value into urllib.request.urlopen.
    # ruleid: auth.py.flow.ssrf
    return urllib.request.urlopen(request.values["u"]).read()


@app.route("/f5")
def fetch_header_client():
    # Tainted header value into an httpx.Client() session call.
    url = request.headers.get("X-Upstream")
    client = httpx.Client()
    # ruleid: auth.py.flow.ssrf
    return client.get(url).text


@app.route("/f6")
def fetch_qualified_request():
    # Fully-qualified flask.request source into requests.get sink.
    # ruleid: auth.py.flow.ssrf
    return requests.get(flask.request.args.get("to")).text


@app.route("/f7")
def fetch_cookie_request_method():
    # Tainted cookie value into requests.request(method, url).
    back = request.cookies.get("origin")
    # ruleid: auth.py.flow.ssrf
    return requests.request("GET", back).text
