# oauthlint-mcp

A [Model Context Protocol](https://modelcontextprotocol.io) server for [OAuthLint](https://oauthlint.dev). It lets AI coding tools (Claude Code, Cursor, Windsurf and any other MCP client) check the OAuth, OIDC, JWT, session and CORS code they generate, in the loop, before it ever reaches your project.

OAuthLint exists because AI coding tools reproduce a small, predictable set of auth mistakes: decoding a JWT without verifying it, accepting the `none` algorithm, setting cookies without `Secure` or `HttpOnly`, reflecting any CORS origin, dropping PKCE, and so on. This server gives the model a way to catch those mistakes itself.

## What it does

The server exposes four tools:

- `scan_code` scans an in-memory snippet. The model pastes the code it just wrote, names the language, and gets back the findings. The snippet is written to a private temporary file, scanned, and the temporary file is removed. Nothing touches your working tree.
- `scan_path` scans a real file or directory on disk.
- `explain_rule` returns the full detail of a rule: severity, CWE, OWASP mapping, why it matters, how to fix it, and vulnerable and safe examples.
- `list_rules` lists the rules OAuthLint ships, optionally filtered by language and minimum severity.

Findings come back as structured data the model can act on (rule id, severity, line, message, CWE, doc URL, and the autofix replacement when a rule ships one), plus a short human-readable summary.

## Requirements

- Node.js 20 or newer.
- [Semgrep](https://semgrep.dev) on your `PATH`. This is the same requirement as the OAuthLint CLI, because the server runs Semgrep under the hood. Install it with `pipx install semgrep` or `brew install semgrep`. If Semgrep is missing, the scan tools return a clear error telling you how to install it, rather than failing silently.

## Install and run

> **Availability:** `oauthlint-mcp` publishes to npm with the next OAuthLint release. The `npx` instructions below are how you will run it once it lands. Until then, run it from source (see "Run from source" below).

Once it is published, no install step is needed. MCP clients launch the server with `npx`:

```bash
npx oauthlint-mcp
```

The server speaks the stdio transport, which is the standard wiring for a local server launched by a desktop AI tool.

### Run from source (until the npm release)

Clone the repo, install dependencies, and build this package:

```bash
git clone https://github.com/Auspeo/oauthlint
cd oauthlint
pnpm install
pnpm --filter oauthlint-mcp build
```

That produces an executable entry point at `mcp/bin/oauthlint-mcp.js`. Point your client at it with `node` and the absolute path instead of `npx`:

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

## Configuration

Each client reads an `mcpServers` block. Add OAuthLint to it.

### Claude Desktop / Claude Code

Edit `claude_desktop_config.json` (Claude Desktop) or your project `.mcp.json` (Claude Code):

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

Edit `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` in your project:

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

Edit `~/.codeium/windsurf/mcp_config.json`:

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

After saving, restart or reload the tool so it picks up the new server. You should then see the four OAuthLint tools available to the model.

## Using it

Once the server is wired in, you can ask the model to use it directly, for example: "Before you hand me that login handler, scan it with OAuthLint." A capable agent will also call `scan_code` on its own when it has just generated auth code, if you tell it to in your system prompt or rules file.

## Security

This is a security tool, so it is careful with what it runs:

- Snippets are written to a unique private temporary directory (mode 0700) with a single file (mode 0600), and the directory is always removed afterwards, even on error.
- No input is ever passed through a shell. Targets are handed to Semgrep as discrete arguments, after a `--` separator, so a path or snippet can never be interpreted as a flag.
- Scans run with a time budget and an output cap, so a pathological input can neither hang the server nor exhaust its memory.
- Inputs are validated at the protocol boundary. Unknown languages, empty or oversized snippets, and bad severities are rejected before anything runs.

## License

MIT, by [Auspeo](https://github.com/Auspeo).
