# ok: auth.py.mcp.missing-resource-binding
auth = AuthSettings(
    issuer_url="https://as.example.com",
    resource_server_url="https://rs.example.com",
    required_scopes=["mcp"],
)
