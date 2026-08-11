// An MCP server forwarding the inbound caller token to an upstream API.
export async function proxyUpstream(req: { auth: { token: string } }) {
  const token = req.auth.token;
  // ruleid: auth.mcp.token-passthrough
  return fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
}
