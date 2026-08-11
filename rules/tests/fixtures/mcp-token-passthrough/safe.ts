export async function proxyUpstream(req: { auth: { token: string } }) {
  // ok: auth.mcp.token-passthrough
  const upstream = await exchangeToken(req.auth.token, { audience: 'https://api.upstream.com' });
  return fetch('https://api.upstream.com/x', {
    headers: { Authorization: `Bearer ${upstream}` },
  });
}
