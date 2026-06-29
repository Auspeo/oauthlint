---
layout: ../../layouts/DocsLayout.astro
title: "MCP server"
description: "Wire OAuthLint into Claude Code, Cursor, Windsurf and other AI coding tools as a Model Context Protocol server, so the model checks its own OAuth/OIDC/JWT/session/CORS code in-loop."
section: "mcp"
---

# MCP server

The OAuthLint MCP server lets AI coding tools check the auth code they generate, in the loop, before it ever reaches your project. It is the OAuthLint thesis made actionable: AI tools reproduce a small, predictable set of OAuth / OIDC / JWT / session / CORS mistakes, so give the model a way to catch them itself.

It runs as a [Model Context Protocol](https://modelcontextprotocol.io) server over the stdio transport, the standard wiring for a local server launched by Claude Code, Claude Desktop, Cursor, Windsurf and other MCP clients.

> **Availability:** `oauthlint-mcp` publishes to npm with the next OAuthLint release. The `npx oauthlint-mcp` setup below is how you will wire it in once it lands. Until then, you can run it from source: see [Run from source](#run-from-source).

## What you get

The server exposes four tools to the model:

- **`scan_code`** scans an in-memory snippet. The model pastes the code it just wrote, names the language (`javascript`, `typescript`, `python`, `go`, `java` or `rust`), and gets the findings back. The snippet is written to a private temporary file, scanned, and the temporary file is removed. It never touches your working tree.
- **`scan_path`** scans a real file or directory on disk.
- **`explain_rule`** returns a rule's severity, CWE, OWASP mapping, why it matters, how to fix it, and vulnerable and safe examples (the same data as [`oauthlint explain`](/docs/cli)).
- **`list_rules`** lists the shipped rules, optionally filtered by language and minimum severity.

Findings come back as structured data the model can act on (rule id, severity, line, message, CWE, doc URL, and the autofix replacement when a rule ships one), alongside a short human-readable summary.

## Requirements

The server runs [Semgrep](/docs/semgrep) under the hood, exactly like the CLI, so Semgrep must be on your `PATH`:

```bash
pipx install semgrep   # or: brew install semgrep
```

You also need Node.js 20 or newer. There is no install step for the server itself; MCP clients launch it with `npx oauthlint-mcp`.

## Wiring it into your tool

Each client reads an `mcpServers` block. Add OAuthLint to it and reload the tool.

### Claude Code and Claude Desktop

For Claude Code, add the server to your project `.mcp.json`. For Claude Desktop, edit `claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "oauthlint": {
      "command": "npx",
      "args": ["-y", "oauthlint-mcp"]
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json` for all projects, or `.cursor/mcp.json` inside one project.

```json
{
  "mcpServers": {
    "oauthlint": {
      "command": "npx",
      "args": ["-y", "oauthlint-mcp"]
    }
  }
}
```

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`.

```json
{
  "mcpServers": {
    "oauthlint": {
      "command": "npx",
      "args": ["-y", "oauthlint-mcp"]
    }
  }
}
```

After saving, restart or reload the tool so it discovers the server. You should then see the four OAuthLint tools available to the model.

### Run from source

Until `oauthlint-mcp` is on npm, run it from a local checkout. Clone the repo, install dependencies, and build this package:

```bash
git clone https://github.com/Auspeo/oauthlint
cd oauthlint
pnpm install
pnpm --filter oauthlint-mcp build
```

That gives you an executable at `mcp/bin/oauthlint-mcp.js`. Point your client at it with `node` and the absolute path, in place of the `npx` command above:

```json
{
  "mcpServers": {
    "oauthlint": {
      "command": "node",
      "args": ["/absolute/path/to/oauthlint/mcp/bin/oauthlint-mcp.js"]
    }
  }
}
```

When the npm release lands, swap this back for the `npx oauthlint-mcp` configuration.

## Using it

Once it is wired in, you can ask the model to use it directly:

> Before you give me that login handler, scan it with OAuthLint.

To make this automatic, tell the model in your system prompt or rules file to call `scan_code` whenever it generates authentication, token, session or CORS code, and to fix anything it reports before showing you the result. That turns OAuthLint into a guardrail the model runs against itself.

## Security

The server is built to the same bar as the rest of OAuthLint:

- Snippets are written to a unique private temporary directory and removed afterwards, even on error. The temporary path is never returned to the caller.
- No input is passed through a shell. Targets are handed to Semgrep as discrete arguments after a `--` separator, so a path or snippet can never be read as a flag.
- Scans run with a time budget and an output cap, so a pathological input cannot hang the server or exhaust its memory.
- Inputs are validated at the protocol boundary; unknown languages, empty or oversized snippets, and bad severities are rejected before anything runs.

If Semgrep is not installed, the scan tools return a clear error with install instructions rather than failing silently.
