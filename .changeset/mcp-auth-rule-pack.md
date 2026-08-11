---
"oauthlint-rules": minor
---

Add an **MCP server-auth rule pack** (`mcp/` and `py/mcp/`) for the official Model Context Protocol SDKs — TypeScript (`@modelcontextprotocol/sdk`) and Python (`mcp` / FastMCP). Eight rules, mapped to CWE/OWASP, each with an enforced vulnerable/safe fixture:

- `auth.mcp.token-passthrough` (taint) — the inbound caller token forwarded to an upstream API instead of a token exchange (confused deputy, CWE-863).
- `auth.mcp.missing-resource-binding` — a token verifier / `AuthSettings` / `requireBearerAuth` with no RFC 8707 audience/resource binding and no Protected Resource Metadata (RFC 9728), CWE-345.
- `auth.mcp.unauthenticated-server` — an MCP transport exposed over the network with no auth middleware, CWE-306.
- `auth.mcp.tool-handler-ssrf` (taint) — an MCP tool-handler argument flowing into an outbound request, CWE-918.

Validated at **zero false positives on the official SDK library source** (added to the validation corpus); example/demo code fires the expected true positives.
