server.registerTool('health', {}, async (args) => {
  // ok: auth.mcp.tool-handler-ssrf
  const r = await fetch('https://api.internal/health');
  return { content: [{ type: 'text', text: await r.text() }] };
});
