import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { ExecaError, execa } from 'execa';
import { type Finding, type FindingFix, SEMGREP_SEVERITY_MAP, type ScanResult } from '../types.js';

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
  // `col` is the 1-based column of the match; `offset` is the 0-based byte
  // offset of the match into the file. Both are present on every real result;
  // `offset` is used to splice in autofix replacements precisely, and `col`
  // is surfaced on the finding's `fix.range` for editors that build edits from
  // line/column rather than byte offsets.
  start: { line: number; col?: number; offset?: number };
  end: { line: number; col?: number; offset?: number };
  extra: {
    severity?: string;
    message?: string;
    // The autofix replacement text for this match's `[start.offset, end.offset)`
    // range. Present only when the matched rule ships a `fix:` (and, with
    // `--dryrun`, the file is left untouched on disk).
    fix?: string;
    metadata?: Record<string, unknown> & {
      'oauthlint-rule-id'?: string;
      'oauthlint-doc-url'?: string;
      cwe?: string;
      'llm-prevalence'?: 'HIGH' | 'MEDIUM' | 'LOW';
    };
  };
}

/** The fix preview for a single file: its current and post-fix contents. */
export interface FileFixPlan {
  /** Absolute path of the file that would be rewritten. */
  path: string;
  /** Current on-disk contents. */
  original: string;
  /** Contents after every applicable fix is applied. */
  fixed: string;
  /** How many individual fixes would be applied to this file. */
  fixCount: number;
}

/** What `--fix` would change across all scanned files — computed without writing. */
export interface FixPlan {
  files: FileFixPlan[];
  /** Total number of fixes across every file. */
  totalFixes: number;
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

/**
 * Thrown when a scan exceeds its configured time budget (`timeoutMs`) or buffers
 * more output than `maxOutputBytes` allows. A bounded, well-behaved failure is
 * preferable to a runaway subprocess — used by long-lived hosts (e.g. the MCP
 * server) that must never hang or exhaust memory on a pathological input.
 */
export class SemgrepResourceError extends Error {
  constructor(reason: 'timeout' | 'output', limit: number) {
    super(
      reason === 'timeout'
        ? `Semgrep scan exceeded its ${limit}ms time budget and was aborted.`
        : `Semgrep output exceeded the ${limit}-byte cap and the scan was aborted.`,
    );
    this.name = 'SemgrepResourceError';
  }
}

export interface SemgrepAdapterOptions {
  /** Override path to the semgrep binary (defaults to `semgrep` on PATH). */
  binary?: string;
  /** Override the rule config — usually a directory of YAML rules. */
  configPath: string;
  /** Working directory to run semgrep from (the target to scan). */
  cwd?: string;
  /**
   * Abort the scan subprocess after this many milliseconds. Off by default
   * (the CLI lets a scan run to completion); long-lived hosts set this so a
   * pathological input can never hang the process.
   */
  timeoutMs?: number;
  /**
   * Cap the bytes buffered from each stdio stream. Off by default (execa's own
   * default applies); long-lived hosts set this to bound memory use.
   */
  maxOutputBytes?: number;
  /**
   * Whether to pass `--metrics=off` (default `true`). Real Semgrep supports the
   * flag and we always disable telemetry there. Semgrep-compatible engines that
   * collect no telemetry (e.g. Opengrep) have no `--metrics` option and error on
   * it, so a caller driving such a binary sets this to `false` to omit the flag.
   * Every other adapter flag is shared, so the same adapter drives either engine.
   */
  metrics?: boolean;
}

export class SemgrepAdapter {
  private readonly binary: string;
  private readonly configPath: string;
  private readonly cwd?: string;
  private readonly timeoutMs?: number;
  private readonly maxOutputBytes?: number;
  private readonly metrics: boolean;

  constructor(opts: SemgrepAdapterOptions) {
    this.binary = opts.binary ?? 'semgrep';
    this.configPath = opts.configPath;
    this.cwd = opts.cwd;
    this.timeoutMs = opts.timeoutMs;
    this.maxOutputBytes = opts.maxOutputBytes;
    this.metrics = opts.metrics ?? true;
  }

  /**
   * The scan flags shared by `scan` and `planFixes`. `--metrics=off` is included
   * only when telemetry control is wanted (real Semgrep); it is omitted for
   * engines that have no `--metrics` option and would error on it (Opengrep).
   */
  private baseScanArgs(): string[] {
    const args = ['scan', '--config', this.configPath, '--json', '--quiet', '--no-git-ignore'];
    if (this.metrics) args.push('--metrics=off');
    return args;
  }

  /** Per-call execa options shared by `scan` and `planFixes`. */
  private execOptions() {
    return {
      cwd: this.cwd,
      reject: false as const,
      stdout: 'pipe' as const,
      stderr: 'pipe' as const,
      ...(this.timeoutMs ? { timeout: this.timeoutMs } : {}),
      ...(this.maxOutputBytes ? { maxBuffer: this.maxOutputBytes } : {}),
    };
  }

  /**
   * Translate a bounded-resource failure (execa `timedOut` / `isMaxBuffer`)
   * into a clear, typed error. Returns without throwing when neither limit
   * was hit, so callers can proceed to parse the output.
   */
  private assertWithinLimits(result: { timedOut?: boolean; isMaxBuffer?: boolean }): void {
    if (result.timedOut) throw new SemgrepResourceError('timeout', this.timeoutMs ?? 0);
    if (result.isMaxBuffer) throw new SemgrepResourceError('output', this.maxOutputBytes ?? 0);
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
    const args = this.baseScanArgs();
    if (options.applyFixes) args.push('--autofix');
    // `--` terminates option parsing so a path that starts with `-` is never
    // mistaken for a flag. Targets are passed as discrete argv entries (never a
    // shell string), so there is no shell-injection surface.
    args.push('--', ...targets);

    let result: Awaited<ReturnType<typeof execa>>;
    try {
      // Semgrep exits non-zero when findings are present; reject:false keeps
      // that from throwing. Optional timeout/maxBuffer bound the subprocess.
      result = await execa(this.binary, args, this.execOptions());
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
    this.assertWithinLimits(result);

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
   * Compute what `--fix` WOULD change, without writing anything. Runs Semgrep
   * with `--autofix --dryrun`, which leaves files on disk untouched but reports
   * each fix's replacement text and byte range in the `--json` output. We splice
   * those replacements into an in-memory copy of each file to produce the exact
   * post-fix contents, so callers can render a diff (`--fix-dry-run`) or a
   * summary of changed files (`--fix`).
   *
   * Replacements within a file are applied from the highest offset down, so the
   * earlier (lower-offset) ranges stay valid as we splice. Overlapping fixes are
   * impossible to apply unambiguously, so any fix that overlaps one already
   * applied is skipped (matching Semgrep's own conservative behaviour).
   *
   * @throws SemgrepNotInstalledError if the binary cannot be found.
   */
  async planFixes(target: string | string[]): Promise<FixPlan> {
    const targets = Array.isArray(target) ? target : [target];
    const args = [...this.baseScanArgs(), '--autofix', '--dryrun', '--', ...targets];

    let result: Awaited<ReturnType<typeof execa>>;
    try {
      result = await execa(this.binary, args, this.execOptions());
    } catch (err) {
      if (isSpawnFailure(err)) throw new SemgrepNotInstalledError();
      throw err;
    }
    if (isSpawnFailure(result)) throw new SemgrepNotInstalledError();
    this.assertWithinLimits(result);

    const stdout = typeof result.stdout === 'string' ? result.stdout : '';
    let parsed: SemgrepJson;
    try {
      parsed = JSON.parse(stdout.trim() || '{}') as SemgrepJson;
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new SemgrepOutputError(detail, stdout.slice(0, 200));
    }

    // Group the fixable matches (those carrying an `extra.fix`) by file.
    const byFile = new Map<string, { start: number; end: number; replacement: string }[]>();
    for (const r of parsed.results ?? []) {
      const replacement = r.extra.fix;
      const start = r.start.offset;
      const end = r.end.offset;
      if (replacement === undefined || start === undefined || end === undefined) continue;
      const abs = isAbsolute(r.path) ? r.path : resolve(this.cwd ?? process.cwd(), r.path);
      const edits = byFile.get(abs) ?? [];
      edits.push({ start, end, replacement });
      byFile.set(abs, edits);
    }

    const files: FileFixPlan[] = [];
    let totalFixes = 0;
    for (const [path, edits] of byFile) {
      let original: Buffer;
      try {
        original = readFileSync(path);
      } catch {
        // The file vanished between scan and read (or isn't readable); skip it
        // rather than fail the whole preview.
        continue;
      }
      // Apply from the end so earlier offsets remain valid against `out`.
      edits.sort((x, y) => y.start - x.start);
      let out = original;
      let appliedFloor = Number.POSITIVE_INFINITY;
      let fixCount = 0;
      for (const e of edits) {
        if (e.end > appliedFloor) continue; // overlaps an already-applied fix
        out = Buffer.concat([
          out.subarray(0, e.start),
          Buffer.from(e.replacement, 'utf8'),
          out.subarray(e.end),
        ]);
        appliedFloor = e.start;
        fixCount++;
      }
      const originalText = original.toString('utf8');
      const fixedText = out.toString('utf8');
      if (fixedText === originalText) continue;
      files.push({ path, original: originalText, fixed: fixedText, fixCount });
      totalFixes += fixCount;
    }

    // Deterministic order for stable diff/summary output.
    files.sort((a, b) => a.path.localeCompare(b.path));
    return { files, totalFixes };
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

  const finding: Finding = {
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

  // Surface match columns when Semgrep reports them (it does for every real
  // result) so the pretty reporter can draw a caret under the matched span.
  // Additive and optional — absent columns just render the frame without a caret.
  if (r.start.col !== undefined) finding.startCol = r.start.col;
  if (r.end.col !== undefined) finding.endCol = r.end.col;

  const fix = toFindingFix(r);
  if (fix) finding.fix = fix;
  return finding;
}

/**
 * Surface a finding's autofix from `extra.fix`, when the matched rule ships a
 * `fix:`. The replacement covers the match's exact span; we carry both the
 * 1-based line/column range and the 0-based byte offsets (whichever a consumer
 * prefers to build an edit from). Returns undefined when there is no fix, so
 * `Finding.fix` stays absent rather than an empty object.
 */
function toFindingFix(r: SemgrepResult): FindingFix | undefined {
  const replacement = r.extra.fix;
  if (replacement === undefined) return undefined;

  const range: FindingFix['range'] = {
    startLine: r.start.line,
    startCol: r.start.col ?? 1,
    endLine: r.end.line,
    endCol: r.end.col ?? 1,
  };
  if (r.start.offset !== undefined) range.startOffset = r.start.offset;
  if (r.end.offset !== undefined) range.endOffset = r.end.offset;
  return { replacement, range };
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
