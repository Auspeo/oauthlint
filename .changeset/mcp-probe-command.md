---
"oauthlint": minor
---

Add `oauthlint probe <url>` — a live, credential-free OAuth 2.1 resource-server conformance check for a running MCP server. It complements the static `mcp/` rule pack: static rules catch the code, `probe` catches deployed behaviour. Every check is a negative test or metadata discovery (no token required): the endpoint must require authentication (401), advertise `resource_metadata` in its `WWW-Authenticate` challenge, expose RFC 9728 Protected Resource Metadata, and reject an invalid bearer token. Supports `--json`.
