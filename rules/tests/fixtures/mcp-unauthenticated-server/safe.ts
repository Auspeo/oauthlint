const auth = requireBearerAuth({ verifier, resourceMetadataUrl });
// ok: auth.mcp.unauthenticated-server
app.post('/mcp', auth, async (req, res) => {
  await transport.handleRequest(req, res, req.body);
});
