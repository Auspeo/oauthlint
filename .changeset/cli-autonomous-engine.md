---
"oauthlint": minor
"oauthlint-mcp": minor
---

Make the CLI and MCP server self-contained: no Semgrep or Python to install. On first run they download and checksum-verify a pinned Opengrep engine (~41 MB, one time, cached), the same engine the editor extensions use. An installed `opengrep` or `semgrep` on your `PATH` is still preferred if present, and you can point at a specific binary with the `OAUTHLINT_ENGINE` environment variable or the `--engine <path>` flag. `oauthlint doctor` now reports the resolved engine.
