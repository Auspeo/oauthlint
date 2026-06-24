import os
import random
import secrets
import string


# ok: auth.py.flow.insecure-random-token -- CSPRNG via secrets.token_urlsafe
def make_session_token():
    session_token = secrets.token_urlsafe(32)
    return session_token


# ok: auth.py.flow.insecure-random-token -- CSPRNG via os.urandom
def make_api_key():
    api_key = os.urandom(32).hex()
    return api_key


# ok: auth.py.flow.insecure-random-token -- CSPRNG via secrets.choice
def make_password():
    alphabet = string.ascii_letters + string.digits
    password = "".join(secrets.choice(alphabet) for _ in range(16))
    return password


# ok: auth.py.flow.insecure-random-token -- non-security use of random (jitter)
def retry_delay():
    delay = random.random()
    return delay


# ok: auth.py.flow.insecure-random-token -- non-security use of random (sampling)
def pick_color():
    color = random.choice(["red", "green", "blue"])
    return color
