async def call_upstream(access_token, client):
    # ok: auth.py.mcp.token-passthrough
    upstream = await exchange_token(access_token.token, audience="https://api.upstream.com")
    return await client.get(
        "https://api.upstream.com/x",
        headers={"Authorization": f"Bearer {upstream}"},
    )
