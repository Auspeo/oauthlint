import jwt
from jwt import decode


def read_no_exp(token: str, key: str):
    # ruleid: auth.py.jwt.no-expiration
    return jwt.decode(token, key, algorithms=["RS256"], options={"verify_exp": False})


def read_no_exp_mixed(token: str, key: str):
    # ruleid: auth.py.jwt.no-expiration
    return jwt.decode(token, key, algorithms=["HS256"], options={"verify_aud": False, "verify_exp": False})


def read_no_exp_destructured(token: str, key: str):
    # ruleid: auth.py.jwt.no-expiration
    return decode(token, key, algorithms=["RS256"], options={"verify_exp": False})
