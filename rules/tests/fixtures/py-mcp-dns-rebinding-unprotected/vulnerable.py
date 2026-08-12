from mcp.server.fastmcp import FastMCP

# ruleid: auth.py.mcp.dns-rebinding-unprotected
mcp = FastMCP("weather", host="0.0.0.0", port=8000)


@mcp.tool()
def forecast(city: str) -> str:
    return "sunny"


mcp.run(transport="streamable-http")


# ruleid: auth.py.mcp.dns-rebinding-unprotected
sse = FastMCP("events", host="0.0.0.0")
sse.run(transport="sse")
