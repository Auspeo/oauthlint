---
"oauthlint-mcp": minor
---

New package: an MCP (Model Context Protocol) server for OAuthLint.

`oauthlint-mcp` lets AI coding tools (Claude Code, Cursor, Windsurf, and others)
scan the OAuth/OIDC/JWT/session/CORS code they generate, in-loop, before it
reaches a human. It runs over stdio and exposes four tools:

- `scan_code` scans an inline snippet (written to a private temp file, removed
  after the scan), so an assistant can check code it just wrote without touching
  the workspace.
- `scan_path` scans a file or directory.
- `explain_rule` returns a rule's severity, CWE, OWASP mapping, and examples.
- `list_rules` lists the catalogue, filterable by language and severity.

Run it with `npx oauthlint-mcp`. It reuses the CLI's scan engine and needs
Semgrep available, like the CLI.
