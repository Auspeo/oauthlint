import jwt


# ok: auth.py.jwt.no-verify -- signature verified with an explicit algorithm
def read_verified(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"])


# ok: auth.py.jwt.no-verify -- verification on, only audience check disabled
def read_partial(token: str, key: str):
    return jwt.decode(token, key, algorithms=["HS256"], options={"verify_aud": False})


# ok: auth.py.jwt.no-verify -- reading the unverified header is the supported safe API
def read_header(token: str):
    return jwt.get_unverified_header(token)
