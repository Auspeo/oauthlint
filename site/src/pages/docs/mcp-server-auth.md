---
layout: ../../layouts/DocsLayout.astro
title: "Scanning MCP servers"
description: "Scan the MCP servers you build for OAuth 2.1 resource-server mistakes: token pass-through, missing audience binding, unauthenticated transports, tool-handler SSRF, DNS rebinding and predictable session ids, plus a live probe command."
section: "mcp-server-auth"
---

# Scanning MCP servers

If you build MCP servers, OAuthLint scans them for the OAuth 2.1 resource-server mistakes that keep showing up in the wild: forwarding the caller's token upstream, never advertising where the authorization server is, mounting the transport with no auth at all, and letting tool arguments drive outbound requests.

> **Two pages, one name.** This page is about scanning the MCP servers *you* build. The [MCP server](/docs/mcp) page is about running OAuthLint *as* an MCP server inside Claude Code, Cursor and other AI tools. One speaks MCP, the other lints MCP.

The rules target the official SDKs: the TypeScript `@modelcontextprotocol/sdk` and the Python `mcp` package (FastMCP). Point OAuthLint at your server's source and it flags each issue with the fix.

```bash
npx oauthlint scan ./src
```

## What the MCP rule pack catches

Six rules ship for TypeScript/JavaScript; the first five also ship for Python. Each maps to a CWE and carries a vulnerable and a safe example in the [rules catalogue](/rules) (search `mcp` to see just this pack).

- **`auth.mcp.token-passthrough`** (`AUTH-MCP-001`, error). The server forwards the incoming caller token to an upstream API. That token was issued for *this* server as its audience (RFC 8707); replaying it against a different resource server is a confused-deputy vulnerability (CWE-863). This is a taint rule, so it catches the token routed through a variable, not just the inline form, and it clears when the value goes through a token exchange (RFC 8693). Ships for TypeScript and Python.
- **`auth.mcp.missing-resource-binding`** (`AUTH-MCP-002`, warning). The server enforces bearer auth via `requireBearerAuth(...)` but passes no `resourceMetadataUrl`. Without it, the 401 `WWW-Authenticate` response carries no `resource_metadata`, so clients cannot discover the authorization server (RFC 9728) and there is no anchor for RFC 8707 audience binding (CWE-345). Ships for TypeScript and Python.
- **`auth.mcp.unauthenticated-server`** (`AUTH-MCP-003`, error). The MCP transport is mounted on a route with no auth middleware in the chain, so any caller can drive the tools (CWE-306). Scoped to handlers that actually dispatch the transport, so ordinary routes do not trip it. Ships for TypeScript and Python.
- **`auth.mcp.tool-handler-ssrf`** (`AUTH-MCP-004`, error). An argument of an MCP tool handler (`server.registerTool` / `server.tool`) flows into an outbound HTTP request without validation (SSRF, CWE-918). Tool arguments are attacker-influenced: an LLM or a malicious caller can point the URL at internal services, cloud metadata (169.254.169.254) or localhost. Ships for TypeScript and Python.
- **`auth.mcp.dns-rebinding-unprotected`** (`AUTH-MCP-005`, error). A `StreamableHTTPServerTransport` is created without DNS-rebinding protection (CWE-346). `enableDnsRebindingProtection` defaults to `false` in the TypeScript SDK, so a malicious web page can rebind a DNS name to loopback and POST to the local server, driving its tools cross-origin from the browser. Ships for TypeScript and Python.
- **`auth.mcp.predictable-session-id`** (`AUTH-MCP-006`, warning). The transport derives its session id from `Date.now()`, `Math.random()` or an incrementing counter (CWE-330). Session ids are the bearer of the MCP session; if they are guessable, another client's session can be hijacked. Stateless mode (no `sessionIdGenerator`) and a CSPRNG such as `randomUUID()` are both fine. TypeScript only.

## A concrete example

The DNS-rebinding default catches most people, because the insecure form is the one you write first. The TypeScript SDK leaves `enableDnsRebindingProtection` off unless you set it:

```ts
// Vulnerable: enableDnsRebindingProtection defaults to false, so a web page
// the user visits can rebind a DNS name to 127.0.0.1 and drive this server.
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});
```

```ts
// Safe: turn it on and pin the Host/Origin allow-lists.
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableDnsRebindingProtection: true,
  allowedHosts: ['127.0.0.1:3000'],
  allowedOrigins: ['https://app.example.com'],
});
```

OAuthLint flags the first as `auth.mcp.dns-rebinding-unprotected` (this is CVE-2025-66416) and stays silent on the second.

## Probe a running server

Static rules scan your source. The `probe` command checks the deployed behaviour of a *running* server. It is a live, credential-free OAuth 2.1 resource-server conformance check: every test is a negative one, so it never needs a token and never writes anything. The server is only sent requests it must already handle.

```bash
npx oauthlint probe https://mcp.example.com/mcp
```

It runs four checks against the URL:

- **Requires authentication.** An unauthenticated request must be refused (401 / 403), not answered with 200.
- **`WWW-Authenticate`.** The 401 challenge should advertise `resource_metadata`, so clients can find the authorization server (RFC 9728).
- **Protected Resource Metadata.** `/.well-known/oauth-protected-resource` should be discoverable and carry `resource` plus a non-empty `authorization_servers` (RFC 9728).
- **Rejects invalid token.** A bogus bearer token must be refused (401 / 403), proving the server actually verifies tokens rather than waving them through.

A healthy server looks like this:

```
OAuthLint MCP auth probe: https://mcp.example.com/mcp
────────────────────────────────────────────────────────────────
 ✓  Requires authentication         401 without a token
 ✓  WWW-Authenticate                Bearer challenge advertises resource_metadata
 ✓  Protected Resource Metadata     RFC 9728 metadata at https://mcp.example.com/.well-known/oauth-protected-resource
 ✓  Rejects invalid token           401 for a bogus bearer token
────────────────────────────────────────────────────────────────
```

Add `--json` for machine-readable output (`{ url, checks }`). `probe` exits `1` if any check hard-fails (unauthenticated endpoint, invalid token accepted, or no Protected Resource Metadata), `0` otherwise. An invalid or unreachable URL exits `2`.

`probe` complements the static rules: the rules read your source before it ships, the probe tests the live server after it deploys. A full RFC 8707 audience check needs a real token from the authorization server, so run the static `mcp/` rules for that. See the [`probe`](/docs/cli#probe) entry in the CLI reference for flags and exit codes.

## See also

- [MCP server](/docs/mcp): run OAuthLint as an MCP server so AI tools scan the auth code they generate.
- [Rules catalogue](/rules): browse every rule with vulnerable and safe examples (search `mcp` for this pack).
- [CLI reference](/docs/cli): every command and flag, including [`probe`](/docs/cli#probe).
