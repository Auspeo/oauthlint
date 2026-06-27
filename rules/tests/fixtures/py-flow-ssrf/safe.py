"""Outbound HTTP requests that are NOT SSRF — must produce zero findings."""

from urllib.parse import urlparse

import requests
from flask import Flask, request

app = Flask(__name__)

ALLOWED_HOSTS = {"api.internal.example.com", "cdn.example.com"}


@app.route("/s1")
def fetch_constant():
    # Constant, attacker-uncontrolled target.
    return requests.get("https://api.example.com/status").text


def is_allowed_url(url):
    # Allow-list style host check.
    host = urlparse(url).netloc
    return host in ALLOWED_HOSTS


@app.route("/s2")
def fetch_validated():
    # Tainted, but cleared by an is_allowed_url(...) check before use.
    url = request.args.get("url")
    if is_allowed_url(url):
        return requests.get(url).text
    return "rejected", 400
