"""Flask views with open redirects: untrusted request data reaches redirect()."""

import flask
from flask import Flask, Response, redirect, request

app = Flask(__name__)


@app.route("/r1")
def redirect_query_get():
    # Direct: request.args.get('next') flows straight into redirect().
    # ruleid: auth.py.flow.open-redirect
    return redirect(request.args.get("next"))


@app.route("/r2")
def redirect_query_subscript():
    # Indirection: tainted value assigned to a local, then redirected.
    dest = request.args["url"]
    # ruleid: auth.py.flow.open-redirect
    return redirect(dest)


@app.route("/r3")
def redirect_form():
    target = request.form.get("redirect_to")
    # ruleid: auth.py.flow.open-redirect
    return redirect(target, code=302)


@app.route("/r4")
def redirect_values():
    # ruleid: auth.py.flow.open-redirect
    return redirect(request.values["return_url"])


@app.route("/r5")
def redirect_cookie():
    # Tainted cookie value reaching the redirect target.
    back = request.cookies.get("last_page")
    # ruleid: auth.py.flow.open-redirect
    return redirect(back)


@app.route("/r6")
def redirect_qualified_request():
    # Fully-qualified flask.request source + flask.redirect sink.
    # ruleid: auth.py.flow.open-redirect
    return flask.redirect(flask.request.args.get("to"))


@app.route("/r7")
def redirect_header_location():
    # Tainted value placed into a Location response header.
    nxt = request.headers.get("X-Forward-To")
    # ruleid: auth.py.flow.open-redirect
    return Response("", status=302, headers={"Location": nxt})
