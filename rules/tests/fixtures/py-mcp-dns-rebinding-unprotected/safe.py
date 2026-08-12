from mcp.server.fastmcp import FastMCP
from mcp.server.transport_security import TransportSecuritySettings

# Explicit transport security with a Host allow-list: safe.
mcp = FastMCP(
    "weather",
    host="0.0.0.0",
    transport_security=TransportSecuritySettings(
        enable_dns_rebinding_protection=True,
        allowed_hosts=["mcp.example.com"],
        allowed_origins=["https://app.example.com"],
    ),
)
mcp.run(transport="streamable-http")


# Loopback bind auto-protects since 1.23.0: out of scope, safe.
local = FastMCP("local", host="127.0.0.1")
local.run(transport="streamable-http")
