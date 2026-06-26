import jwt


# ok: auth.py.jwt.no-expiration -- default behaviour verifies `exp`
def read_default(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"])


# ok: auth.py.jwt.no-expiration -- expiry verification explicitly enabled
def read_verify_exp_on(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"], options={"verify_exp": True})


# ok: auth.py.jwt.no-expiration -- a different option is disabled, not `verify_exp`
def read_other_option(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})
