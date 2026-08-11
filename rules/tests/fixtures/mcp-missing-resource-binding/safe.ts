// ok: auth.mcp.missing-resource-binding
const auth = requireBearerAuth({
  verifier,
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
});
