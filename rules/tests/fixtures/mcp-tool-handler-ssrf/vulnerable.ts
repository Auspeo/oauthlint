server.registerTool('fetch_url', {}, async (args) => {
  // ruleid: auth.mcp.tool-handler-ssrf
  const r = await fetch(args.url);
  return { content: [{ type: 'text', text: await r.text() }] };
});
