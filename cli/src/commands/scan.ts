import { resolve } from 'node:path';
import { RULES_ROOT } from 'oauthlint-rules';
import pc from 'picocolors';
import {
  type FixPlan,
  SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepOutputError,
} from '../adapters/semgrep.js';
import {
  BaselineNotFoundError,
  BaselineParseError,
  DEFAULT_BASELINE_FILE,
  loadBaseline,
  partitionByBaseline,
} from '../core/baseline.js';
import { GitError, resolveDiffFiles, resolveStagedFiles } from '../core/changed-files.js';
import { loadConfig } from '../core/config.js';
import { renderFixPreview, renderFixSummary } from '../core/fix-plan.js';
import { Reporter } from '../core/reporter.js';
import { toSarif } from '../core/sarif.js';
import { exitCodeFor, highestSeverity, meetsThreshold } from '../core/severity.js';
import { applySuppressions } from '../core/suppress.js';
import { EngineUnavailableError, resolveEngine } from '../engine/index.js';
import { renderHtmlReport } from '../formatters/html.js';
import type { Finding, SeverityName } from '../types.js';

export type ScanFormat = 'pretty' | 'json' | 'sarif' | 'html';

export interface ScanCommandOptions {
  /**
   * Path(s) to scan. Accepts one or many — e.g. a pre-commit hook or editor
   * integration passing the list of changed files. Defaults to `['.']`.
   * The legacy singular `path` is still honoured for backwards compatibility.
   */
  paths?: string[];
  /** @deprecated single-path form, kept for backwards compatibility. */
  path?: string;
  /**
   * Incremental: scan only files changed versus a git ref. When the flag is
   * given without a value (`true`), the ref defaults to the merge-base with the
   * repo's default branch (origin/HEAD → origin/main → origin/master → HEAD).
   */
  diff?: string | boolean;
  /** Incremental: scan only git-staged files (`--cached`). For pre-commit. */
  staged?: boolean;
  /** Legacy boolean — equivalent to `format: 'json'`. */
  json?: boolean;
  /** Output format. Overrides `json` when set. */
  format?: ScanFormat;
  severity?: SeverityName;
  failOn?: SeverityName | 'off';
  rulesDir?: string;
  /**
   * Apply auto-fixes (rewrites source files in place) for rules that ship a
   * `fix:` template — the TLS/cert-verification flag flips (Rust `reqwest`,
   * Go `crypto/tls`) and the Go `http.Cookie` `Secure`/`HttpOnly` flips. Each
   * fix is a deterministic literal replacement proven by the rule pack's
   * autofix safety contract; running `--fix` twice is a no-op (idempotent).
   */
  fix?: boolean;
  /**
   * Preview what `--fix` WOULD change without writing anything: prints a unified
   * diff per file and a summary. Takes precedence over `--fix` (when both are
   * given, nothing is written).
   */
  fixDryRun?: boolean;
  /**
   * Suppress findings already captured in a baseline file, reporting only NEW
   * findings. A bare `true` uses the default `.oauthlint-baseline.json`; a
   * string is treated as an explicit baseline path. A missing file is a clear
   * error, never silently an empty allow-list.
   */
  baseline?: string | boolean;
  /**
   * Show a source code frame (context + caret) beneath each finding in the
   * pretty output. Defaults to on; `--no-code-frame` (or `codeFrame: false` in
   * the config) turns it off. Ignored for json/sarif/html.
   */
  codeFrame?: boolean;
  /** Used by tests to inject a mock adapter. */
  adapter?: SemgrepAdapter;
  /** Used by tests to capture output. */
  stream?: NodeJS.WritableStream;
  /** Override the directory git/relative paths resolve from (defaults to cwd). */
  cwd?: string;
}

export async function runScan(opts: ScanCommandOptions): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const config = await loadConfig(cwd);
  const rulesDir = opts.rulesDir ?? config.customRulesDir ?? RULES_ROOT;
  const failOn = opts.failOn ?? config.failOn ?? 'HIGH';
  const format: ScanFormat = opts.format ?? (opts.json ? 'json' : 'pretty');
  const stream = opts.stream ?? process.stdout;
  const errStream = opts.stream ?? process.stderr;

  // Load the baseline up front so a missing/malformed file fails fast — before
  // we pay for a full scan — with a clear error rather than a silent no-op.
  let baseline: Awaited<ReturnType<typeof loadBaseline>> | null = null;
  if (opts.baseline !== undefined && opts.baseline !== false) {
    const baselinePath = resolve(
      cwd,
      typeof opts.baseline === 'string' ? opts.baseline : DEFAULT_BASELINE_FILE,
    );
    try {
      baseline = await loadBaseline(baselinePath);
    } catch (err) {
      if (err instanceof BaselineNotFoundError || err instanceof BaselineParseError) {
        errStream.write(`${err.message}\n`);
        return 2;
      }
      throw err;
    }
  }

  // Resolve the set of targets to hand Semgrep. Incremental flags (--diff /
  // --staged) win and narrow the scan to changed files only; otherwise we scan
  // the explicit path args (default ['.']).
  let targets: string[];
  let incremental = false;
  try {
    if (opts.diff !== undefined && opts.diff !== false) {
      incremental = true;
      const ref = typeof opts.diff === 'string' ? opts.diff : undefined;
      targets = await resolveDiffFiles(cwd, ref);
    } else if (opts.staged) {
      incremental = true;
      targets = await resolveStagedFiles(cwd);
    } else {
      const requested = opts.paths?.length
        ? opts.paths
        : opts.path !== undefined
          ? [opts.path]
          : ['.'];
      targets = requested.map((p) => resolve(cwd, p));
    }
  } catch (err) {
    if (err instanceof GitError) {
      errStream.write(`${err.message}\n`);
      return 2;
    }
    throw err;
  }

  // Incremental change set is empty (nothing in a supported language changed).
  // That's a success, not an error — pre-commit hooks and editors call this
  // constantly and should exit 0 with a clear note rather than failing.
  if (incremental && targets.length === 0) {
    if (format === 'json') {
      stream.write(`${JSON.stringify({ schemaVersion: 'oauthlint-v1', findings: [] })}\n`);
    } else if (format === 'sarif') {
      const empty = await toSarif({
        findings: [],
        scannedFiles: 0,
        durationMs: 0,
        semgrepVersion: null,
        errors: [],
      });
      stream.write(`${JSON.stringify(empty, null, 2)}\n`);
    } else if (format === 'html') {
      const html = await renderHtmlReport(
        { findings: [], scannedFiles: 0, durationMs: 0, semgrepVersion: null, errors: [] },
        { target: 'changed files (none)' },
      );
      stream.write(html);
      errStream.write('No changed files to scan.\n');
    } else {
      stream.write('No changed files to scan.\n');
    }
    return 0;
  }

  const label = incremental ? `${targets.length} changed file(s)` : targets.join(', ');
  const codeFrame = opts.codeFrame ?? config.codeFrame ?? true;
  const reporter = new Reporter({ json: format === 'json', stream, codeFrame, cwd });
  if (format === 'pretty') reporter.reportStart(label, await countRuleFiles(rulesDir));

  // Resolve the scan engine (installed opengrep/semgrep, or a pinned Opengrep the
  // CLI downloads and checksum-verifies on first run). `metrics` is on only for
  // real Semgrep, which alone accepts `--metrics=off`.
  let adapter = opts.adapter;
  if (!adapter) {
    try {
      const engine = await resolveEngine();
      adapter = new SemgrepAdapter({
        configPath: rulesDir,
        binary: engine.path,
        metrics: engine.engine === 'semgrep',
      });
    } catch (err) {
      if (err instanceof EngineUnavailableError) {
        errStream.write(`${err.message}\n`);
        return 127;
      }
      throw err;
    }
  }
  // `--fix-dry-run` previews changes and never writes; it wins over `--fix`.
  const dryRun = opts.fixDryRun === true;
  const applyFixes = opts.fix === true && !dryRun;

  let result: Awaited<ReturnType<SemgrepAdapter['scan']>>;
  let fixPlan: FixPlan | null = null;
  try {
    // Compute the fix plan (a dry run that writes nothing) BEFORE applying, so
    // the post-fix summary and the dry-run preview both reflect exactly what
    // would change. The applying scan then runs second.
    if (dryRun || applyFixes) {
      fixPlan = await adapter.planFixes(targets);
    }
    result = await adapter.scan(targets, { applyFixes });
  } catch (err) {
    if (err instanceof SemgrepNotInstalledError) {
      (opts.stream ?? process.stderr).write(`${err.message}\n`);
      return 127;
    }
    if (err instanceof SemgrepOutputError) {
      // Fail loudly: a scan we cannot interpret must not exit 0 and look
      // clean in CI. 2 mirrors the "critical" exit code.
      (opts.stream ?? process.stderr).write(`${err.message}\n`);
      return 2;
    }
    throw err;
  }

  // Apply inline suppression directives first (they're source-truth)
  // and then the severity filter on whatever survives.
  let findings: Finding[] = result.findings;
  const { kept, suppressed } = await applySuppressions(findings);
  findings = kept;
  const minSeverity = opts.severity;
  if (minSeverity) {
    findings = findings.filter((f) => meetsThreshold(f.severity, minSeverity));
  }

  // Baseline suppression: drop findings whose fingerprint is already recorded,
  // so only genuinely NEW findings are reported and gate the exit code.
  let baselinedCount = 0;
  if (baseline) {
    const { newFindings, baselined } = await partitionByBaseline(findings, baseline, cwd);
    findings = newFindings;
    baselinedCount = baselined.length;
  }

  if (format === 'sarif') {
    const sarif = await toSarif({ ...result, findings });
    stream.write(`${JSON.stringify(sarif, null, 2)}\n`);
  } else if (format === 'html') {
    // HTML is the report artifact → stdout only. Any human chatter (e.g. the
    // update notice, suppression counts) stays on stderr so the document is
    // never corrupted and `> report.html` is always valid.
    const html = await renderHtmlReport({ ...result, findings }, { target: label });
    stream.write(html);
    if (suppressed.length > 0) {
      errStream.write(
        `ℹ ${suppressed.length} finding${
          suppressed.length === 1 ? '' : 's'
        } suppressed via inline directives.\n`,
      );
    }
    if (baselinedCount > 0) {
      errStream.write(
        `ℹ ${baselinedCount} finding${
          baselinedCount === 1 ? '' : 's'
        } already in the baseline (reporting NEW findings only).\n`,
      );
    }
  } else {
    reporter.reportResult({ ...result, findings });
    if (fixPlan && format === 'pretty') {
      const color = pc.isColorSupported;
      if (dryRun) {
        stream.write(renderFixPreview(fixPlan, { cwd, color }));
      } else {
        stream.write(renderFixSummary(fixPlan, { cwd }));
      }
    }
    if (suppressed.length > 0 && format === 'pretty') {
      stream.write(
        `\nℹ ${suppressed.length} finding${
          suppressed.length === 1 ? '' : 's'
        } suppressed via inline directives.\n`,
      );
    }
    if (baselinedCount > 0 && format === 'pretty') {
      stream.write(
        `\nℹ ${baselinedCount} finding${
          baselinedCount === 1 ? '' : 's'
        } already in the baseline (reporting NEW findings only).\n`,
      );
    }
  }

  if (failOn === 'off') return 0;
  const worst = highestSeverity(findings);
  if (worst === null) return 0;
  if (!meetsThreshold(worst, failOn)) return 0;
  return exitCodeFor(worst);
}

async function countRuleFiles(dir: string): Promise<number> {
  try {
    const { loadAllRules } = await import('oauthlint-rules');
    const rules = await loadAllRules(dir);
    return rules.length;
  } catch {
    return 0;
  }
}
