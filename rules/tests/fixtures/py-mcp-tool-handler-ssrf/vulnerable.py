import httpx


@mcp.tool()
def fetch_url(url: str) -> str:
    # ruleid: auth.py.mcp.tool-handler-ssrf
    return httpx.get(url).text
