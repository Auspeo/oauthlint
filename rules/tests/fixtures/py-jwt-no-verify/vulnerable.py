import jwt


def read_legacy(token: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, verify=False)


def read_legacy_with_key(token: str, key: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, key, algorithms=["HS256"], verify=False)


def read_options(token: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, options={"verify_signature": False})


def read_options_mixed(token: str, key: str):
    # ruleid: auth.py.jwt.no-verify
    return jwt.decode(token, key, options={"verify_aud": False, "verify_signature": False})
