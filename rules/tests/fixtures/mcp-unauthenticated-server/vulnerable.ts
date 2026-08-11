// ruleid: auth.mcp.unauthenticated-server
app.post('/mcp', async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});
