# oauthlint-benchmark (internal)

A reproducible harness that measures **which OAuth / OIDC / JWT / session / CORS
anti-patterns AI models produce** when asked to write authentication code.

It prompts each model with a fixed suite of realistic, neutrally worded
auth-building tasks, scans every generated file with the shipped OAuthLint rule
pack, and tallies which rules fired per model. The result is a per-model table
of how often each anti-pattern shows up in default model output.

> This package is **private and never published** (`"private": true`, no
> `publishConfig`). It exists to produce evidence, not to ship.

## What it measures

- **Prompts** (`src/prompts.ts`): ~12 fixed tasks across TypeScript, JavaScript,
  and Python (an Express login/session route, verifying a JWT in Node,
  configuring CORS for a FastAPI app, storing an OAuth token in a React SPA,
  hashing a password in Python, a Flask session config, an OAuth callback
  handler, ...). Each is worded to ask for the *feature*, never hinting at a
  vulnerability, so what gets measured is the model's default choice.
- **Scan**: each generated file is written to a private temp file and scanned
  with `SemgrepAdapter` against `RULES_ROOT` (the same engine and pack the CLI
  and MCP server use).
- **Aggregate** (`src/runner.ts`): per model, per rule, the count and percentage
  of samples that contained at least one finding of that rule, plus the overall
  percentage of samples with any finding.

## Requirements

- Node 20+ (uses the global `fetch`; no HTTP-client dependency).
- [Semgrep](https://semgrep.dev) on `PATH` (same requirement as the CLI). The
  mock adapter still scans real code, so scanning is always exercised.
- An API key **only** for the real model adapters (see below). The mock adapter
  is fully offline.

## Run it (offline, no keys)

```sh
pnpm install
pnpm --filter oauthlint-benchmark build
node benchmark/bin/oauthlint-benchmark.js run --models mock --samples 5
```

This writes `report.md` and `report.json` to `benchmark/results/` (gitignored)
and prints the summary.

## Run it against real models

```sh
export ANTHROPIC_API_KEY=...   # for the anthropic adapter
export OPENAI_API_KEY=...      # for the openai adapter
pnpm --filter oauthlint-benchmark build
node benchmark/bin/oauthlint-benchmark.js run --models anthropic,openai --samples 20
```

Each adapter throws a clear error if its key is missing, so a keyless run fails
fast rather than making an unauthenticated request.

## CLI options

| Flag | Default | Meaning |
| --- | --- | --- |
| `--models <keys>` | `mock` | Comma-separated adapter keys: `mock`, `anthropic`, `openai`. |
| `--samples <n>` | `5` | Samples generated per prompt per model. |
| `--anonymize` / `--no-anonymize` | anonymize **on** | Label models as `Model A/B/...` (default) or use real ids. |
| `--prompts <ids>` | all | Comma-separated prompt ids to run. |
| `--out <dir>` | `benchmark/results` | Output directory for `report.md` + `report.json`. |

### Why anonymize by default

Reports anonymize model ids by default (`Model A`, `Model B`, ... assigned in
sorted-id order for determinism). The benchmark is about the *class of mistake*
AI codegen makes, not a league table of named commercial products; anonymizing
avoids comparative claims about specific vendors. Pass `--no-anonymize` when you
explicitly want the real ids (e.g. an internal run you control).

## Methodology (for anyone citing a run)

- **Fixed, neutral prompts.** The suite is versioned and worded without security
  framing, so it captures default behavior rather than behavior under a hint.
- **N samples per prompt.** Model output varies run to run; multiple samples
  give a prevalence rate rather than a single anecdote.
- **Scored by the shipped rule pack.** Findings come from the exact rules
  OAuthLint ships, so the numbers inherit whatever the pack does and does not
  cover.
- **Reproducible.** Same prompts + same pack + same sample count. A failed
  generation is skipped and reported (`failedSamples`) rather than silently
  changing the denominator.

## Layout

```
benchmark/
  bin/oauthlint-benchmark.js   CLI entry (calls dist/cli.js)
  src/
    prompts.ts                 the fixed prompt suite
    scanner.ts                 scanGenerated(code, language) -> Finding[]
    runner.ts                  runBenchmark(...) -> BenchmarkResult
    report.ts                  toMarkdown / toJson / anonymizeResult
    cli.ts                     the `run` command
    adapters/
      types.ts                 ModelAdapter + extractCode
      mock.ts                  offline, deterministic, anti-pattern-laden
      anthropic.ts             Anthropic Messages API adapter
      openai.ts                OpenAI Chat Completions adapter
      index.ts                 adapter registry + resolveAdapters
  tests/                       vitest (scan-dependent tests skip without Semgrep)
  results/                     generated reports (gitignored)
```
