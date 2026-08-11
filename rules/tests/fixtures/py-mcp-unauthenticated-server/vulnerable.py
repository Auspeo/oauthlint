mcp = FastMCP("demo")

@mcp.tool()
def run_query(sql: str) -> str:
    return sql

# ruleid: auth.py.mcp.unauthenticated-server
mcp.run(transport="streamable-http")
