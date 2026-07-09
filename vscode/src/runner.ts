import { join } from 'node:path';
import {
  type Finding,
  SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepResourceError,
} from 'oauthlint';

/**
 * Subset of oauthlint's report shape we consume here.
 * Kept intentionally small + decoupled so we can unit-test the runner
 * without pulling the VS Code module into the test environment.
 */
/**
 * The exact span an autofix replacement overwrites. Mirrors the engine's
 * `FixRange`: lines/columns are 1-based and `endCol` is exclusive.
 */
export interface OAuthLintFixRange {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
  startOffset?: number;
  endOffset?: number;
}

/** Per-finding autofix data — present only when the rule ships a `fix:`. */
export interface OAuthLintFix {
  replacement: string;
  range: OAuthLintFixRange;
}

export interface OAuthLintFinding {
  ruleId: string;
  oauthlintRuleId?: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  filePath: string;
  startLine: number;
  endLine: number;
  message: string;
  docUrl?: string;
  cwe?: string;
  llmPrevalence?: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Autofix data — present only when the rule ships a `fix:` for this match. */
  fix?: OAuthLintFix;
}

export interface OAuthLintReport {
  schemaVersion: 'oauthlint-v1';
  scannedFiles: number;
  durationMs: number;
  semgrepVersion: string | null;
  errors: string[];
  findings: OAuthLintFinding[];
}

export interface RunOptions {
  /** Path to scan (file or directory). */
  target: string;
  /** Override the bundled rules directory. Empty = the packaged rule pack. */
  rulesDir?: string;
  /**
   * Path to the scan engine binary. Empty = `semgrep` from PATH. The extension
   * passes the managed Opengrep binary here (see `engine.ts`).
   */
  semgrepPath?: string;
  /**
   * Whether the engine understands `--metrics=off`. `true` (default) for real
   * Semgrep; set `false` for Opengrep, which has no `--metrics` option and
   * errors on the flag. Threaded straight through to the adapter.
   */
  metrics?: boolean;
  /** Working directory the scan runs from. */
  cwd?: string;
  /** Abort the run after this many ms; resolves with a timed-out result. */
  timeoutMs?: number;
}

export interface RunResult {
  report: OAuthLintReport | null;
  /**
   * Best-effort exit-style code: `0` on a clean run, `1` on an internal engine
   * error, `null` when no scan process ran (Semgrep missing / resource abort).
   */
  exitCode: number | null;
  /** Diagnostic text surfaced in the VS Code output channel. */
  stderr: string;
  /** Whether the run was aborted due to timeout. */
  timedOut: boolean;
  /** Whether the run was aborted because its output exceeded the size cap. */
  outputCapped: boolean;
  /**
   * The engine binary could not be spawned (ENOENT). With the managed engine
   * this means the resolved binary vanished; the extension resets the engine
   * manager and re-attempts the download.
   */
  semgrepMissing: boolean;
}

/**
 * Cap on the output we are willing to buffer from Semgrep. A runaway scan or a
 * pathologically large report should never be allowed to exhaust the editor's
 * memory — past this the adapter aborts the process and we surface an error.
 */
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

/**
 * Directory that holds the bundled rule YAMLs. They are copied next to the
 * bundled extension at build time (see `esbuild.mjs`), so at runtime they sit
 * in `dist/rules` alongside the bundled `dist/extension.js`. `__dirname` is
 * `dist/` in the packaged extension.
 */
function bundledRulesDir(): string {
  return join(__dirname, 'rules');
}

/**
 * Run the OAuthLint engine in-process against `target` and normalise its
 * findings to the report shape the extension renders.
 *
 * Runs entirely inside the extension host (no `oauthlint` CLI on PATH); the
 * only external dependency is the Semgrep binary the adapter drives. Designed
 * to never throw — the VS Code layer wants a result object it can render either
 * way — and to bound both time (`timeoutMs`) and memory (`MAX_OUTPUT_BYTES`).
 */
export async function runOAuthLint(opts: RunOptions): Promise<RunResult> {
  const configPath = opts.rulesDir?.trim() ? opts.rulesDir : bundledRulesDir();
  const adapter = new SemgrepAdapter({
    configPath,
    ...(opts.semgrepPath?.trim() ? { binary: opts.semgrepPath } : {}),
    ...(opts.metrics === undefined ? {} : { metrics: opts.metrics }),
    ...(opts.cwd ? { cwd: opts.cwd } : {}),
    ...(opts.timeoutMs ? { timeoutMs: opts.timeoutMs } : {}),
    maxOutputBytes: MAX_OUTPUT_BYTES,
  });

  try {
    const scan = await adapter.scan([opts.target]);
    return {
      report: {
        schemaVersion: 'oauthlint-v1',
        scannedFiles: scan.scannedFiles,
        durationMs: scan.durationMs,
        semgrepVersion: scan.semgrepVersion,
        errors: scan.errors,
        findings: scan.findings.map(toFinding),
      },
      exitCode: 0,
      stderr: scan.errors.join('\n'),
      timedOut: false,
      outputCapped: false,
      semgrepMissing: false,
    };
  } catch (err) {
    if (err instanceof SemgrepNotInstalledError) {
      return {
        report: null,
        exitCode: null,
        stderr: err.message,
        timedOut: false,
        outputCapped: false,
        semgrepMissing: true,
      };
    }
    if (err instanceof SemgrepResourceError) {
      // The adapter throws one error type for both bounded-resource aborts; its
      // message distinguishes the time budget from the output cap.
      const timedOut = err.message.includes('time budget');
      return {
        report: null,
        exitCode: null,
        stderr: err.message,
        timedOut,
        outputCapped: !timedOut,
        semgrepMissing: false,
      };
    }
    return {
      report: null,
      exitCode: 1,
      stderr: err instanceof Error ? err.message : String(err),
      timedOut: false,
      outputCapped: false,
      semgrepMissing: false,
    };
  }
}

/** Map an engine `Finding` onto the extension's `OAuthLintFinding` shape. */
function toFinding(f: Finding): OAuthLintFinding {
  const out: OAuthLintFinding = {
    ruleId: f.ruleId,
    severity: f.severity,
    filePath: f.filePath,
    startLine: f.startLine,
    endLine: f.endLine,
    message: f.message,
  };
  if (f.oauthlintRuleId !== undefined) out.oauthlintRuleId = f.oauthlintRuleId;
  if (f.docUrl !== undefined) out.docUrl = f.docUrl;
  if (f.cwe !== undefined) out.cwe = f.cwe;
  if (f.llmPrevalence !== undefined) out.llmPrevalence = f.llmPrevalence;
  if (f.fix !== undefined) {
    out.fix = { replacement: f.fix.replacement, range: { ...f.fix.range } };
  }
  return out;
}

/**
 * Filter findings to those at-or-above a minimum severity. Exposed
 * separately so the VS Code layer can re-filter on settings changes
 * without re-running the scan.
 */
const SEVERITY_ORDER: Record<OAuthLintFinding['severity'], number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

export function filterBySeverity(
  findings: OAuthLintFinding[],
  min: OAuthLintFinding['severity'],
): OAuthLintFinding[] {
  const threshold = SEVERITY_ORDER[min];
  return findings.filter((f) => SEVERITY_ORDER[f.severity] >= threshold);
}
