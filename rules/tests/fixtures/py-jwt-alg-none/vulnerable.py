import jwt


def decode_none(token: str, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["none"])


def decode_none_case(token: str, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["RS256", "None"])


def decode_none_upper(token: str, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.decode(token, key, algorithms=["NONE"])


def encode_none(claims: dict, key: str):
    # ruleid: auth.py.jwt.alg-none
    return jwt.encode(claims, key, algorithm="none")
