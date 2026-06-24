import jwt


# ok: auth.py.jwt.no-algorithms -- explicit algorithms allowlist
def verify_with_algorithms(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"])


# ok: auth.py.jwt.no-algorithms -- allowlist alongside other options
def verify_with_algorithms_and_audience(token: str, key: str):
    return jwt.decode(token, key, algorithms=["RS256"], audience="my-api")


# ok: auth.py.jwt.no-algorithms -- single-arg decode is not a verification (and is covered by no-verify)
def decode_single_arg(token: str):
    return jwt.decode(token)


# ok: auth.py.jwt.no-algorithms -- signature disabled is reported by auth.py.jwt.no-verify, not here
def decode_verify_disabled(token: str, key: str):
    return jwt.decode(token, key, options={"verify_signature": False})


# ok: auth.py.jwt.no-algorithms -- encoding is not affected by the algorithms allowlist rule
def issue_token(claims: dict, key: str):
    return jwt.encode(claims, key, algorithm="RS256")
