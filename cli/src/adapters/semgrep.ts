import { ExecaError, execa } from 'execa';
import { type Finding, SEMGREP_SEVERITY_MAP, type ScanResult } from '../types.js';

/**
 * Shape of `semgrep --json` output. We only declare the fields we read.
 */
interface SemgrepJson {
  version?: string;
  results?: SemgrepResult[];
  errors?: { message?: string; long_msg?: string }[];
  paths?: { scanned?: string[] };
}

interface SemgrepResult {
  check_id: string;
  path: string;
  start: { line: number };
  end: { line: number };
  extra: {
    severity?: string;
    message?: string;
    metadata?: Record<string, unknown> & {
      'oauthlint-rule-id'?: string;
      'oauthlint-doc-url'?: string;
      cwe?: string;
      'llm-prevalence'?: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  };
}

export class SemgrepNotInstalledError extends Error {
  constructor() {
    super(
      'Semgrep is not installed.\n' +
        'Install it with: pipx install semgrep   (or)   brew install semgrep\n' +
        'See https://semgrep.dev/docs/getting-started/ for more options.',
    );
    this.name = 'SemgrepNotInstalledError';
  }
}

/**
 * Thrown when Semgrep's `--json` output cannot be parsed. Previously this was
 * swallowed and reported as "0 findings" — which made a broken scan look like
 * a clean one and let CI pass silently. We now fail loudly instead.
 */
export class SemgrepOutputError extends Error {
  constructor(detail: string, snippet?: string) {
    const tail = snippet ? `\n--- first bytes of output ---\n${snippet}` : '';
    super(
      `Could not parse Semgrep output: ${detail}.\nThis usually means the scan was interrupted or Semgrep emitted an error.\nRe-run with the semgrep CLI directly to see the raw output.${tail}`,
    );
    this.name = 'SemgrepOutputError';
  }
}

export interface SemgrepAdapterOptions {
  /** Override path to the semgrep binary (defaults to `semgrep` on PATH). */
  binary?: string;
  /** Override the rule config — usually a directory of YAML rules. */
  configPath: string;
  /** Working directory to run semgrep from (the target to scan). */
  cwd?: string;
}

export class SemgrepAdapter {
  private readonly binary: string;
  private readonly configPath: string;
  private readonly cwd?: string;

  constructor(opts: SemgrepAdapterOptions) {
    this.binary = opts.binary ?? 'semgrep';
    this.configPath = opts.configPath;
    this.cwd = opts.cwd;
  }

  /**
   * Run semgrep against one or more targets, returning a normalised scan
   * result. `target` may be a single path (directory or file) or an explicit
   * list of files — Semgrep accepts multiple targets natively, which is how
   * incremental scanning (`--diff` / `--staged` / explicit file args) only
   * pays for the files that actually changed.
   *
   * When `applyFixes` is true, Semgrep rewrites the source files in place
   * using each rule's `fix:` template. The returned report reflects what
   * was matched BEFORE the rewrite — callers should re-scan if they want
   * a clean post-fix report.
   *
   * @throws SemgrepNotInstalledError if the binary cannot be found.
   */
  async scan(
    target: string | string[],
    options: { applyFixes?: boolean } = {},
  ): Promise<ScanResult> {
    const start = Date.now();
    const targets = Array.isArray(target) ? target : [target];
    const args = [
      'scan',
      '--config',
      this.configPath,
      '--json',
      '--quiet',
      '--no-git-ignore',
      '--metrics=off',
    ];
    if (options.applyFixes) args.push('--autofix');
    // `--` terminates option parsing so a path that starts with `-` is never
    // mistaken for a flag. Targets are passed as discrete argv entries (never a
    // shell string), so there is no shell-injection surface.
    args.push('--', ...targets);

    let result: Awaited<ReturnType<typeof execa>>;
    try {
      result = await execa(this.binary, args, {
        cwd: this.cwd,
        reject: false,
        // Semgrep exits non-zero when findings are present; we don't want that to throw.
        stdout: 'pipe',
        stderr: 'pipe',
      });
    } catch (err) {
      if (isSpawnFailure(err)) {
        throw new SemgrepNotInstalledError();
      }
      throw err;
    }

    // Even with reject:false, execa surfaces spawn failures via the result object.
    if (isSpawnFailure(result)) {
      throw new SemgrepNotInstalledError();
    }

    const stdout = typeof result.stdout === 'string' ? result.stdout : '';
    let parsed: SemgrepJson;
    try {
      // An empty stdout is legitimate (no targets / no findings on some
      // Semgrep versions); anything non-empty that fails to parse is a real
      // failure we must surface rather than silently report as "clean".
      parsed = JSON.parse(stdout.trim() || '{}') as SemgrepJson;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new SemgrepOutputError(detail, stdout.slice(0, 200));
    }

    const findings = (parsed.results ?? []).map(toFinding);
    return {
      findings,
      scannedFiles: parsed.paths?.scanned?.length ?? 0,
      durationMs: Date.now() - start,
      semgrepVersion: parsed.version ?? null,
      errors: (parsed.errors ?? []).map((e) => e.long_msg ?? e.message ?? 'unknown semgrep error'),
    };
  }

  /**
   * Check whether Semgrep is callable at all. Used by `oauthlint doctor`.
   */
  async getVersion(): Promise<string | null> {
    try {
      const { stdout } = await execa(this.binary, ['--version'], { reject: false });
      return stdout.trim() || null;
    } catch (err) {
      if (isSpawnFailure(err)) return null;
      throw err;
    }
  }
}

function toFinding(r: SemgrepResult): Finding {
  const rawSeverity = (r.extra.severity ?? 'INFO').toUpperCase();
  const severity = SEMGREP_SEVERITY_MAP[rawSeverity] ?? 'MEDIUM';

  return {
    ruleId: normaliseRuleId(r.check_id),
    oauthlintRuleId: r.extra.metadata?.['oauthlint-rule-id'],
    severity,
    filePath: r.path,
    startLine: r.start.line,
    endLine: r.end.line,
    message: (r.extra.message ?? '').trim(),
    docUrl: r.extra.metadata?.['oauthlint-doc-url'],
    cwe: r.extra.metadata?.cwe,
    llmPrevalence: r.extra.metadata?.['llm-prevalence'],
  };
}

/**
 * Strip the file-path prefix Semgrep adds when loading rules from a
 * directory. Semgrep encodes the relative path into `check_id`, so a
 * rule defined as `auth.jwt.alg-none` in
 * `packages/oauthlint-rules/rules/jwt/alg-none.yml` is reported as
 * `packages.oauthlint-rules.rules.jwt.auth.jwt.alg-none`.
 *
 * OAuthLint rule ids have the shape `auth.<category>.<name>` (JS/TS) or
 * `auth.<lang>.<category>.<name>` for language packs (e.g.
 * `auth.py.jwt.no-verify`), so we pull out the trailing match. The regex is
 * deliberately anchored at the END so we don't accidentally truncate
 * `auth.oauth.hardcoded-secret` into `auth.hardcoded-secret` when the
 * path itself contains the substring `auth.` more than once (e.g.
 * `rules.oauth.auth.oauth.hardcoded-secret`, where `oauth` ends with
 * "auth" before the dot). The optional middle segment captures the language.
 *
 * Custom (non-OAuthLint) rule ids that don't fit the shape are returned
 * unchanged.
 */
// The `(?<![a-z])` lookbehind pins `auth` to a segment boundary so the `auth`
// inside `oauth` is not mistaken for the id start (which the optional language
// segment would otherwise allow, e.g. `...oauth.auth.oauth.hardcoded-secret`).
const OAUTHLINT_ID_RE = /(?<![a-z])auth\.(?:[a-z][a-z0-9]*\.)?[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/;

export function normaliseRuleId(rawId: string): string {
  const match = rawId.match(OAUTHLINT_ID_RE);
  return match ? match[0] : rawId;
}

function isSpawnFailure(err: unknown): boolean {
  // Direct throw path (when execa is configured to reject).
  if (err instanceof ExecaError) {
    return (err as { code?: string }).code === 'ENOENT';
  }
  // reject:false path — execa returns a result object that exposes `failed`
  // plus `code` / `cause` indicating ENOENT when the binary is missing.
  if (typeof err === 'object' && err !== null) {
    const r = err as { code?: string; failed?: boolean; cause?: { code?: string } };
    if (r.code === 'ENOENT') return true;
    if (r.cause?.code === 'ENOENT') return true;
  }
  return false;
}
