import jwt


def decode_rs256(token: str, key: str):
    # ok: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["RS256"])


def decode_multiple_strong(token: str, key: str):
    # ok: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["RS256", "ES256"])


def encode_hs256(claims: dict, key: str):
    # ok: auth.py.jwt.alg-none
    return jwt.encode(claims, key, algorithm="HS256")
