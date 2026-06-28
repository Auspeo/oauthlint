import jwt


def decode_hs_then_rs(token: str, key: str):
    # ruleid: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["HS256", "RS256"])


def decode_rs_then_hs(token: str, key: str):
    # ruleid: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["RS256", "HS256"])


def decode_hs_and_es(token: str, key: str):
    # ruleid: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["HS384", "ES256"])


def decode_hs_and_ps(token: str, key: str):
    # ruleid: auth.py.jwt.algorithm-confusion
    return jwt.decode(token, key, algorithms=["PS256", "HS512"])
