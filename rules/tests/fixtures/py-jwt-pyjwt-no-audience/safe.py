import jwt


def verify(token: str, key: str):
    # ok: auth.py.jwt.pyjwt-no-audience
    return jwt.decode(
        token,
        key,
        algorithms=["RS256"],
        issuer="https://auth.example.com",
        audience="https://mcp.example.com/mcp",
    )
