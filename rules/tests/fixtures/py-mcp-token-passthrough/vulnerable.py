async def call_upstream(access_token, client):
    # ruleid: auth.py.mcp.token-passthrough
    return await client.get(
        "https://api.github.com/user",
        headers={"Authorization": f"Bearer {access_token.token}"},
    )
