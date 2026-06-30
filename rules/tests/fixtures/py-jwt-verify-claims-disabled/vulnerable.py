import jwt

token = "..."
key = "secret"

# ruleid: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(token, key, algorithms=["RS256"], options={"verify_aud": False})

# ruleid: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(token, key, algorithms=["HS256"], options={"verify_iss": False})

# ruleid: auth.py.jwt.verify-claims-disabled
claims = jwt.decode(token, key, algorithms=["RS256"], options={"verify_nbf": False})

from jwt import decode

# ruleid: auth.py.jwt.verify-claims-disabled
claims = decode(token, key, algorithms=["RS256"], options={"verify_aud": False, "verify_iss": False})
