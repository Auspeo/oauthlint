import jwt


def decode_rs256_only(token: str, key: str):
    # ok: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["RS256"])


def decode_hs256_only(token: str, secret: str):
    # ok: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, secret, algorithms=["HS256"])


def decode_es256_only(token: str, key: str):
    # ok: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["ES256"])


def decode_multiple_asymmetric(token: str, key: str):
    # ok: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["RS256", "ES256"])
