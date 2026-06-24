import random
import string


def make_session_token():
    # ruleid: auth.py.flow.insecure-random-token
    session_token = random.getrandbits(256)
    return session_token


def make_otp():
    # ruleid: auth.py.flow.insecure-random-token
    otp = random.randint(100000, 999999)
    return otp


def make_password():
    alphabet = string.ascii_letters + string.digits
    # ruleid: auth.py.flow.insecure-random-token
    password = "".join(random.choice(alphabet) for _ in range(16))
    return password


def make_api_key():
    alphabet = string.ascii_letters + string.digits
    # ruleid: auth.py.flow.insecure-random-token
    api_key = "".join(random.choices(alphabet, k=32))
    return api_key


def make_reset_secret():
    # ruleid: auth.py.flow.insecure-random-token
    reset_secret = random.random()
    return reset_secret
