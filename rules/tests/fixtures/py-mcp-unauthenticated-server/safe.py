mcp = FastMCP(
    "demo",
    token_verifier=verifier,
    auth=AuthSettings(issuer_url="https://as", resource_server_url="https://rs"),
)

# ok: auth.py.mcp.unauthenticated-server
mcp.run(transport="streamable-http")
