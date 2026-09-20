from mcp.server.auth.settings import AuthSettings

# ok: auth.py.mcp.token-audience-unchecked
settings = AuthSettings(
    issuer_url="https://auth.example.com",
    resource_server_url="https://mcp.example.com/mcp",
    required_scopes=["mcp:tools"],
    validate_token_resource=True,
)
