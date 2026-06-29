import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import pc, { createColors } from 'picocolors';
import type { Finding, ScanResult, SeverityName } from '../types.js';
import { renderCodeFrame } from './code-frame.js';

const SEVERITY_COLOR: Record<SeverityName, (s: string) => string> = {
  CRITICAL: (s) => pc.bgRed(pc.white(s)),
  HIGH: pc.red,
  MEDIUM: pc.yellow,
  LOW: pc.cyan,
  INFO: pc.gray,
};

/**
 * Foreground accent per severity, used for the code-frame gutter and caret.
 * Distinct from {@link SEVERITY_COLOR} so CRITICAL renders as plain red here
 * rather than the inverted badge used for the severity tag.
 */
type Colors = ReturnType<typeof createColors>;
function accentFor(severity: SeverityName, colors: Colors): (s: string) => string {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return colors.red;
    case 'MEDIUM':
      return colors.yellow;
    case 'LOW':
      return colors.cyan;
    default:
      return colors.gray;
  }
}

export interface ReporterOptions {
  /** When true, emit machine-readable JSON instead of pretty output. */
  json?: boolean;
  /** Stream to write to (defaults to process.stdout). */
  stream?: NodeJS.WritableStream;
  /**
   * Show a source code frame (context lines + caret) under each finding in the
   * pretty output. Default on; `--no-code-frame` disables it.
   */
  codeFrame?: boolean;
  /**
   * Whether to emit ANSI colour. Defaults to picocolors' own detection
   * (honours NO_COLOR / `--no-color` / non-TTY). Mainly an injection point for
   * deterministic tests.
   */
  color?: boolean;
  /** Directory relative finding paths resolve against (defaults to cwd). */
  cwd?: string;
}

export class Reporter {
  private readonly json: boolean;
  private readonly stream: NodeJS.WritableStream;
  private readonly codeFrame: boolean;
  private readonly cwd: string;
  private readonly colors: Colors;
  /** Per-path source cache so each file is read at most once per report. */
  private readonly fileCache = new Map<string, string | null>();

  constructor(opts: ReporterOptions = {}) {
    this.json = opts.json ?? false;
    this.stream = opts.stream ?? process.stdout;
    this.codeFrame = opts.codeFrame ?? true;
    this.cwd = opts.cwd ?? process.cwd();
    this.colors = createColors(opts.color ?? pc.isColorSupported);
  }

  reportStart(target: string, ruleCount: number): void {
    if (this.json) return;
    this.line(pc.dim(`OAuthLint — scanning ${pc.bold(target)}`));
    this.line(pc.dim(`Loaded ${ruleCount} rules`));
    this.line('');
  }

  reportResult(result: ScanResult): void {
    if (this.json) {
      const payload = {
        schemaVersion: 'oauthlint-v1',
        scannedFiles: result.scannedFiles,
        durationMs: result.durationMs,
        semgrepVersion: result.semgrepVersion,
        errors: result.errors,
        findings: result.findings.map((f) => ({
          ruleId: f.ruleId,
          oauthlintRuleId: f.oauthlintRuleId,
          severity: f.severity,
          filePath: f.filePath,
          startLine: f.startLine,
          endLine: f.endLine,
          message: f.message,
          docUrl: f.docUrl,
          cwe: f.cwe,
          llmPrevalence: f.llmPrevalence,
          // Present only when the rule ships a `fix:`; `JSON.stringify` drops it
          // (undefined) otherwise, so findings without a fix stay byte-identical
          // to the pre-autofix-contract output.
          fix: f.fix,
        })),
      };
      this.line(JSON.stringify(payload, null, 2));
      return;
    }

    const sep = pc.dim('━'.repeat(60));
    if (result.findings.length === 0) {
      this.line(pc.green('✓ No auth issues found.'));
      this.line(
        pc.dim(
          `Scanned ${result.scannedFiles} file${result.scannedFiles === 1 ? '' : 's'} in ${result.durationMs}ms.`,
        ),
      );
      return;
    }

    const counts = countBySeverity(result.findings);
    const summary = [
      counts.CRITICAL ? pc.red(`${counts.CRITICAL} critical`) : null,
      counts.HIGH ? pc.red(`${counts.HIGH} high`) : null,
      counts.MEDIUM ? pc.yellow(`${counts.MEDIUM} medium`) : null,
      counts.LOW ? pc.cyan(`${counts.LOW} low`) : null,
      counts.INFO ? pc.gray(`${counts.INFO} info`) : null,
    ]
      .filter((x): x is string => x !== null)
      .join(pc.dim(' · '));

    this.line(sep);
    this.line(
      pc.bold(`Found ${result.findings.length} issue${result.findings.length === 1 ? '' : 's'}: `) +
        summary,
    );
    this.line('');

    const sorted = [...result.findings].sort((a, b) => {
      const order: SeverityName[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
      return order.indexOf(a.severity) - order.indexOf(b.severity);
    });

    for (const f of sorted) {
      this.printFinding(f);
    }

    this.line(sep);
    this.line(
      pc.dim(
        `Scanned ${result.scannedFiles} files in ${result.durationMs}ms${result.semgrepVersion ? ` · semgrep ${result.semgrepVersion}` : ''}`,
      ),
    );
    if (result.errors.length > 0) {
      this.line(
        pc.yellow(
          `⚠ ${result.errors.length} semgrep error${result.errors.length === 1 ? '' : 's'}:`,
        ),
      );
      for (const e of result.errors) {
        this.line(pc.dim(`  · ${e}`));
      }
    }
  }

  private printFinding(f: Finding): void {
    const tag = SEVERITY_COLOR[f.severity](` ${f.severity} `);
    const id = pc.bold(f.ruleId);
    this.line(`${tag} ${id}${f.oauthlintRuleId ? pc.dim(` (${f.oauthlintRuleId})`) : ''}`);
    this.line(pc.dim(`  ${f.filePath}:${f.startLine}`));
    if (this.codeFrame) this.printCodeFrame(f);
    const firstLine = f.message.split('\n')[0]?.trim() ?? '';
    if (firstLine) this.line(pc.dim('  → ') + firstLine);
    if (f.docUrl) this.line(pc.dim(`  📖 ${f.docUrl}`));
    // Teaching hint: every finding points at the offline explainer. Pretty mode
    // only — reportResult returns early under `--json`, and SARIF/HTML never
    // touch the Reporter, so machine-readable output stays uncorrupted.
    this.line(pc.dim(`  ↳ run \`oauthlint explain ${f.ruleId}\` for details + the fix`));
    this.line('');
  }

  /**
   * Print a source code frame beneath the `file:line` line. Degrades gracefully
   * — and silently — when the columns are missing (no precise span to point at)
   * or the file can't be read, leaving the existing terse output intact.
   */
  private printCodeFrame(f: Finding): void {
    if (f.startCol === undefined || f.endCol === undefined) return;
    const source = this.readSource(f.filePath);
    if (source === null) return;

    const frame = renderCodeFrame(
      source,
      { startLine: f.startLine, endLine: f.endLine, startCol: f.startCol, endCol: f.endCol },
      {
        accent: accentFor(f.severity, this.colors),
        dim: this.colors.dim,
        maxWidth: this.terminalWidth(),
      },
    );
    if (frame.length === 0) return;
    this.line('');
    for (const row of frame) this.line(`  ${row}`);
    this.line('');
  }

  /** Read and cache a file's contents; `null` when it can't be read. */
  private readSource(filePath: string): string | null {
    const abs = isAbsolute(filePath) ? filePath : resolve(this.cwd, filePath);
    const cached = this.fileCache.get(abs);
    if (cached !== undefined) return cached;
    let source: string | null;
    try {
      source = readFileSync(abs, 'utf8');
    } catch {
      source = null;
    }
    this.fileCache.set(abs, source);
    return source;
  }

  /**
   * Usable width for the frame. Reserves a small margin off the terminal width
   * (the frame is already indented two spaces) and clamps to a sane range so a
   * very wide or unknown-width terminal never produces an unwieldy frame.
   */
  private terminalWidth(): number {
    const cols = (this.stream as { columns?: number }).columns;
    const width = typeof cols === 'number' && cols > 0 ? cols : 80;
    return Math.max(40, Math.min(width - 2, 120));
  }

  private line(s = ''): void {
    this.stream.write(`${s}\n`);
  }
}

function countBySeverity(findings: Finding[]): Record<SeverityName, number> {
  const counts: Record<SeverityName, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  };
  for (const f of findings) counts[f.severity]++;
  return counts;
}
