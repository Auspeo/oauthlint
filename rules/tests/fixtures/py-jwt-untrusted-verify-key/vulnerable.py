"""Request-controlled key / algorithms flowing into jwt.decode (PyJWT)."""

import jwt
from flask import Flask, request

app = Flask(__name__)

PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"


@app.route("/a")
def attacker_key():
    token = request.headers.get("Authorization")
    key = request.args.get("key")
    # ruleid: auth.py.jwt.untrusted-verify-key
    return jwt.decode(token, key, algorithms=["HS256"])


@app.route("/b")
def attacker_algorithms():
    token = request.headers.get("Authorization")
    algs = request.args.getlist("alg")
    # ruleid: auth.py.jwt.untrusted-verify-key
    return jwt.decode(token, PUBLIC_KEY, algorithms=algs)


@app.route("/c")
def attacker_key_kwarg():
    token = request.args.get("token")
    header_key = request.headers.get("X-Key")
    # ruleid: auth.py.jwt.untrusted-verify-key
    return jwt.decode(token, key=header_key, algorithms=["HS256"])
