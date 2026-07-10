# oauthlint-mcp

## 0.1.3

### Patch Changes

- Updated dependencies [4780eb2]
  - oauthlint-rules@0.6.0
  - oauthlint@0.9.2

## 0.1.2

### Patch Changes

- Updated dependencies [958db1a]
  - oauthlint-rules@0.5.1
  - oauthlint@0.9.1

## 0.1.1

### Patch Changes

- Ship the 155-rule pack to MCP clients, so AI coding tools scan against the
  current framework-aware coverage from oauthlint-rules 0.5.0.
- Updated dependencies
- Updated dependencies [6702555]
- Updated dependencies [013c4dc]
- Updated dependencies [0791d32]
  - oauthlint@0.9.0
  - oauthlint-rules@0.5.0

## 0.1.0

### Minor Changes

- 8513dba: New package: an MCP (Model Context Protocol) server for OAuthLint.

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

### Patch Changes

- Updated dependencies [efc2d17]
- Updated dependencies [8513dba]
- Updated dependencies [9574a26]
- Updated dependencies [9574a26]
  - oauthlint@0.8.0
  - oauthlint-rules@0.4.0
