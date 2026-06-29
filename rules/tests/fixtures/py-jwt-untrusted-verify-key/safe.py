"""Server-pinned key and algorithms — the token may come from the request."""

import jwt
from flask import Flask, request

app = Flask(__name__)

PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
ALLOWED_ALGS = ["RS256"]


@app.route("/a")
def pinned():
    # ok: auth.py.jwt.untrusted-verify-key -- key and algorithms are server constants
    token = request.headers.get("Authorization")
    return jwt.decode(token, PUBLIC_KEY, algorithms=ALLOWED_ALGS)


@app.route("/b")
def token_from_request_is_fine():
    # ok: auth.py.jwt.untrusted-verify-key -- only the token is request-controlled (expected); key/algs are fixed
    token = request.args.get("access_token")
    return jwt.decode(token, PUBLIC_KEY, algorithms=["RS256"])


@app.route("/c")
def validated_algorithm():
    # ok: auth.py.jwt.untrusted-verify-key -- candidate algorithm vetted against an allowlist before use
    token = request.headers.get("Authorization")
    alg = request.args.get("alg")
    return jwt.decode(token, PUBLIC_KEY, algorithms=[validate_algorithm(alg)])


def validate_algorithm(candidate: str) -> str:
    if candidate not in {"RS256", "ES256"}:
        raise ValueError("unsupported algorithm")
    return candidate
