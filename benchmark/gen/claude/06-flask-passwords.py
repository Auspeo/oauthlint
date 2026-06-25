"""
Minimal Flask app with user registration and login.

- Passwords are hashed with PBKDF2-HMAC-SHA256 (stdlib hashlib) using a
  per-user random salt; we store "iterations$salt$hash" and verify with a
  constant-time comparison.
- Users live in a SQLite database (stdlib sqlite3).
- Sessions track the logged-in user.

Run:
    pip install flask
    python 06-flask-passwords.py
Then POST form-encoded `username` + `password` to /register and /login.
"""

import hashlib
import hmac
import os
import secrets
import sqlite3

from flask import Flask, g, jsonify, redirect, request, session, url_for

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")

# Password hashing parameters
HASH_NAME = "sha256"
ITERATIONS = 240_000
SALT_BYTES = 16

app = Flask(__name__)
# In production load this from the environment; random per-process is fine for a demo.
app.secret_key = os.environ.get("SECRET_KEY", secrets.token_hex(32))


# --------------------------------------------------------------------------- #
# Database helpers
# --------------------------------------------------------------------------- #
def get_db():
    """Return a per-request SQLite connection."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the users table if it does not already exist."""
    db = sqlite3.connect(DB_PATH)
    try:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                username      TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()
    finally:
        db.close()


# --------------------------------------------------------------------------- #
# Password hashing
# --------------------------------------------------------------------------- #
def hash_password(password: str) -> str:
    """Return an encoded 'iterations$salt_hex$hash_hex' string."""
    salt = secrets.token_bytes(SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(HASH_NAME, password.encode("utf-8"), salt, ITERATIONS)
    return f"{ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    """Constant-time check of a plaintext password against a stored hash."""
    try:
        iterations_s, salt_hex, hash_hex = encoded.split("$")
        iterations = int(iterations_s)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, AttributeError):
        return False
    dk = hashlib.pbkdf2_hmac(HASH_NAME, password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(dk, expected)


# --------------------------------------------------------------------------- #
# Routes
# --------------------------------------------------------------------------- #
@app.route("/register", methods=["POST"])
def register():
    username = (request.form.get("username") or "").strip()
    password = request.form.get("password") or ""

    if not username or not password:
        return jsonify(error="username and password are required"), 400
    if len(password) < 8:
        return jsonify(error="password must be at least 8 characters"), 400

    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, hash_password(password)),
        )
        db.commit()
    except sqlite3.IntegrityError:
        # UNIQUE constraint on username
        return jsonify(error="username already taken"), 409

    return jsonify(message="registered", username=username), 201


@app.route("/login", methods=["POST"])
def login():
    username = (request.form.get("username") or "").strip()
    password = request.form.get("password") or ""

    db = get_db()
    row = db.execute(
        "SELECT id, username, password_hash FROM users WHERE username = ?",
        (username,),
    ).fetchone()

    # Always run verify_password to keep timing roughly uniform whether or not
    # the user exists. Use a throwaway hash when there's no matching row.
    stored = row["password_hash"] if row else hash_password("dummy")
    if row and verify_password(password, stored):
        session.clear()
        session["user_id"] = row["id"]
        session["username"] = row["username"]
        return jsonify(message="logged in", username=row["username"]), 200

    return jsonify(error="invalid username or password"), 401


@app.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify(message="logged out"), 200


@app.route("/me", methods=["GET"])
def me():
    if "user_id" not in session:
        return jsonify(error="not authenticated"), 401
    return jsonify(user_id=session["user_id"], username=session["username"]), 200


@app.route("/")
def index():
    if "username" in session:
        return jsonify(message=f"hello, {session['username']}")
    return jsonify(message="not logged in"), 200


if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
