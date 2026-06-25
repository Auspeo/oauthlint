# AI-codegen auth benchmark

A reproducible harness that measures **the OAuth/JWT/auth bugs AI coding tools
ship** — the empirical backing for OAuthLint's `llm-prevalence` metadata.

The premise of the project is that AI assistants regurgitate the same auth
anti-patterns. This benchmark turns that claim into data you can re-run.

## How it works

1. **`prompts/`** — a versioned suite of realistic auth-coding tasks (one
   markdown file per task, with frontmatter: `id`, `language`, `ext`, `stack`,
   `domains`). They are written as a developer would ask — *"build this feature"* —
   with **no security framing**, so the generated code reflects what the tool
   actually produces by default.
2. **`gen/<tool>/`** — the code each AI tool produced for those prompts, one file
   per prompt id (`gen/<tool>/<id>.<ext>`).
3. **`run.ts`** — scans every `gen/<tool>/` with the OAuthLint pack and writes
   [`RESULTS.md`](./RESULTS.md) + `results.json`: how many prompts each tool
   shipped with findings, the totals, and the per-prompt breakdown.

## Run it

```bash
pnpm build          # build the CLI the runner shells out to
pnpm bench          # tsx benchmark/run.ts → RESULTS.md + results.json
```

(Requires Semgrep on PATH, like the CLI.)

## Add a tool

Generate code for each prompt with the tool you want to test (Copilot, Cursor,
Gemini, a raw model API, …) and save the files as `gen/<tool>/<prompt-id>.<ext>`,
matching the prompt ids. Re-run `pnpm bench`. The runner picks the new tool up
automatically and adds it to the scoreboard.

## Add a prompt

Drop a `prompts/<id>.md` with the same frontmatter shape, regenerate code for it
across tools, and re-run.

## Findings are hand-verified

Every finding in the `gen/claude/` baseline was manually reviewed against the
generated code — a linter benchmark is only worth citing if its own findings
hold up. That review found and fixed **two false positives** in the rule pack:

- `auth.oauth.no-state-validation` fired on a callback that *did* validate
  `state` — it read `state` into a local and compared the local two lines later,
  which the rule couldn't see. Fixed to recognize the captured-variable shape.
- `auth.cors.reflect-origin` (HIGH) fired on an allowlist callback —
  `if (allowed.includes(origin)) cb(null, true)` — i.e. the exact safe pattern
  the rule's own message recommends. Fixed to only flag callbacks that ignore
  their origin argument and allow unconditionally.

After those fixes the remaining findings are true positives. One is
context-dependent and called out as such: `auth.java.web.csrf-disabled` on
`09-spring-security` correctly detects that CSRF is disabled — defensible for a
*stateless* bearer-token API, but flagged because it is a frequent and often
wrong AI default. (Like the localStorage false-negative this harness surfaced
earlier, the FPs are a feature of running the benchmark, not a strike against it.)

## Honest caveats (read before citing)

- The default `gen/claude/` baseline is **one vendor under one framing** — a
  *lower bound*. Completion-style tools and older models likely produce more.
  The benchmark only becomes citable once several tools are run side by side.
- Small sample. It is **directional, not statistical** — designed to be extended.
- "Findings" includes best-practice gaps (missing PKCE, JWT `algorithms`
  pinning, rate limiting), not only critical bugs. Read `RESULTS.md`, don't just
  quote the headline number.
- Scored by OAuthLint's own rules — the baseline is hand-verified (above), but
  cross-tool comparisons inherit whatever the pack does and doesn't cover.

## Why this exists

A generic Semgrep registry can copy our *rules*; it cannot produce *this* —
evidence about which auth mistakes AI tools make, kept current as models ship.
That is the angle, made measurable.
