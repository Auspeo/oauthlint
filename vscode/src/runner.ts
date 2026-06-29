import { spawn } from 'node:child_process';

/**
 * Subset of oauthlint's --json output we consume here.
 * Kept intentionally small + decoupled so we can unit-test the runner
 * without pulling the VS Code module into the test environment.
 */
/**
 * The exact span an autofix replacement overwrites. Mirrors the CLI's
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
  /** Path to the oauthlint binary. Default: assume on PATH. */
  cliPath?: string;
  /** Override the bundled rules directory. */
  rulesDir?: string;
  /** Working directory for the CLI process. */
  cwd?: string;
  /** Abort the run after this many ms; resolves with a partial report. */
  timeoutMs?: number;
}

export interface RunResult {
  report: OAuthLintReport | null;
  /** Non-zero CLI exit code (or null if the process was killed). */
  exitCode: number | null;
  /** Stderr captured from the CLI — surfaced in the VS Code output channel. */
  stderr: string;
  /** Whether the run was aborted due to timeout. */
  timedOut: boolean;
  /** Whether the run was aborted because its output exceeded the size cap. */
  outputCapped: boolean;
}

/**
 * Cap on combined stdout+stderr we are willing to buffer. A runaway scan or a
 * pathologically large report should never be allowed to exhaust the editor's
 * memory — past this we kill the process and surface an error instead.
 */
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

const EMPTY_REPORT: OAuthLintReport = {
  schemaVersion: 'oauthlint-v1',
  scannedFiles: 0,
  durationMs: 0,
  semgrepVersion: null,
  errors: [],
  findings: [],
};

/**
 * Run the oauthlint CLI in JSON mode against `target` and parse its output.
 *
 * Designed to be cancellation-friendly (timeout) and to never throw — the
 * VS Code extension layer wants a result object it can render either way.
 */
export function runOAuthLint(opts: RunOptions): Promise<RunResult> {
  return new Promise((resolveResult) => {
    const cli = opts.cliPath ?? 'oauthlint';
    // Target goes after `--` so a path that begins with `-` can never be
    // mistaken for a flag. Commander treats everything after `--` as operands.
    const args = ['scan', '--json', '--fail-on', 'off'];
    if (opts.rulesDir) args.push('--rules-dir', opts.rulesDir);
    args.push('--', opts.target);

    let stdout = '';
    let stderr = '';
    let outputBytes = 0;
    let settled = false;
    let timedOut = false;
    let outputCapped = false;

    const child = spawn(cli, args, {
      cwd: opts.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const kill = () => {
      child.kill('SIGTERM');
      setTimeout(() => child.kill('SIGKILL'), 1000);
    };

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          kill();
        }, opts.timeoutMs)
      : null;

    // Guard both pipes against unbounded growth. The first chunk that pushes us
    // over the cap trips `outputCapped` and tears the process down; `close`
    // then resolves with a clear error instead of a truncated/parsed report.
    const overCap = (chunkLength: number): boolean => {
      outputBytes += chunkLength;
      if (outputBytes <= MAX_OUTPUT_BYTES || outputCapped) return outputCapped;
      outputCapped = true;
      kill();
      return true;
    };

    child.stdout.on('data', (buf: Buffer) => {
      if (overCap(buf.length)) return;
      stdout += buf.toString();
    });
    child.stderr.on('data', (buf: Buffer) => {
      if (overCap(buf.length)) return;
      stderr += buf.toString();
    });
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolveResult({
        report: null,
        exitCode: null,
        stderr: `${stderr}\n${err.message}`,
        timedOut,
        outputCapped,
      });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      if (outputCapped) {
        resolveResult({
          report: null,
          exitCode: code,
          stderr:
            `${stderr}\noauthlint output exceeded ${MAX_OUTPUT_BYTES} bytes; scan aborted.`.trim(),
          timedOut,
          outputCapped,
        });
        return;
      }
      const report = parseReport(stdout);
      resolveResult({ report, exitCode: code, stderr, timedOut, outputCapped });
    });
  });
}

function parseReport(stdout: string): OAuthLintReport | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<OAuthLintReport>;
    if (parsed.schemaVersion !== 'oauthlint-v1') return null;
    return { ...EMPTY_REPORT, ...parsed, findings: parsed.findings ?? [] };
  } catch {
    return null;
  }
}

/**
 * Filter findings to those at-or-above a minimum severity. Exposed
 * separately so the VS Code layer can re-filter on settings changes
 * without re-running the CLI.
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
