import { spawn } from 'node:child_process';

/**
 * Subset of oauthlint's --json output we consume here.
 * Kept intentionally small + decoupled so we can unit-test the runner
 * without pulling the VS Code module into the test environment.
 */
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
}

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
    const args = ['scan', opts.target, '--json', '--fail-on', 'off'];
    if (opts.rulesDir) args.push('--rules-dir', opts.rulesDir);

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;

    const child = spawn(cli, args, {
      cwd: opts.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const timer = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          child.kill('SIGTERM');
          setTimeout(() => child.kill('SIGKILL'), 1000);
        }, opts.timeoutMs)
      : null;

    child.stdout.on('data', (buf) => {
      stdout += buf.toString();
    });
    child.stderr.on('data', (buf) => {
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
      });
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      const report = parseReport(stdout);
      resolveResult({ report, exitCode: code, stderr, timedOut });
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
