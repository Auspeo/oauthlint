"""Flask redirects that are NOT open redirects — must produce zero findings."""

from urllib.parse import urlparse

from flask import Flask, redirect, request, url_for

app = Flask(__name__)

ALLOWED = {"/home", "/dashboard", "/settings"}


@app.route("/s1")
def redirect_url_for():
    # Safe by construction: destination built from a known endpoint name.
    return redirect(url_for("dashboard"))


@app.route("/s2")
def redirect_constant():
    # Constant, attacker-uncontrolled target.
    return redirect("/home")


def is_safe_url(target):
    # Same-host allow-list style check.
    ref = urlparse(request.host_url)
    test = urlparse(target)
    return test.scheme in ("http", "https") and ref.netloc == test.netloc


@app.route("/s3")
def redirect_validated():
    # Tainted, but cleared by an is_safe_url(...) check before use.
    target = request.args.get("next")
    if is_safe_url(target):
        return redirect(target)
    return redirect(url_for("home"))


@app.route("/s4")
def redirect_allow_list():
    # Tainted, but only redirected when present in an explicit allow-list,
    # and even then to the validated constant rather than the raw value.
    dest = request.args.get("to")
    if dest in ALLOWED:
        return redirect(url_for("page", name=dest))
    return redirect("/home")
