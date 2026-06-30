import jwt

token = "..."
key = "secret"

# Audience and issuer are validated by supplying the expected values.
# ok: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(token, key, algorithms=["RS256"], audience="api")

# ok: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(
    token, key, algorithms=["RS256"], audience="api", issuer="https://issuer.example.com"
)

# Disabling signature/expiration is handled by other rules, not this one.
# ok: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(token, key, algorithms=["RS256"], options={"verify_signature": False})

# ok: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(token, key, algorithms=["RS256"], options={"verify_exp": False})
