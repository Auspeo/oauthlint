import jwt


def sign(payload: dict):
    # ruleid: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, "super-secret-key")


def sign_with_alg(payload: dict):
    # ruleid: auth.py.jwt.hardcoded-secret
    return jwt.encode(payload, "super-secret-key", algorithm="HS256")


def verify(token: str):
    # ruleid: auth.py.jwt.hardcoded-secret
    return jwt.decode(token, "super-secret-key", algorithms=["HS256"])
