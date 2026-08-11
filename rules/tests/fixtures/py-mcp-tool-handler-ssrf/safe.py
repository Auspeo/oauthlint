import httpx


@mcp.tool()
def health() -> str:
    # ok: auth.py.mcp.tool-handler-ssrf
    return httpx.get("https://api.internal/health").text
