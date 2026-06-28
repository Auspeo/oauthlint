import pc from 'picocolors';
import type { Finding, ScanResult, SeverityName } from '../types.js';

const SEVERITY_COLOR: Record<SeverityName, (s: string) => string> = {
  CRITICAL: (s) => pc.bgRed(pc.white(s)),
  HIGH: pc.red,
  MEDIUM: pc.yellow,
  LOW: pc.cyan,
  INFO: pc.gray,
};

export interface ReporterOptions {
  /** When true, emit machine-readable JSON instead of pretty output. */
  json?: boolean;
  /** Stream to write to (defaults to process.stdout). */
  stream?: NodeJS.WritableStream;
}

export class Reporter {
  private readonly json: boolean;
  private readonly stream: NodeJS.WritableStream;

  constructor(opts: ReporterOptions = {}) {
    this.json = opts.json ?? false;
    this.stream = opts.stream ?? process.stdout;
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
    const firstLine = f.message.split('\n')[0]?.trim() ?? '';
    if (firstLine) this.line(pc.dim('  → ') + firstLine);
    if (f.docUrl) this.line(pc.dim(`  📖 ${f.docUrl}`));
    // Teaching hint: every finding points at the offline explainer. Pretty mode
    // only — reportResult returns early under `--json`, and SARIF/HTML never
    // touch the Reporter, so machine-readable output stays uncorrupted.
    this.line(pc.dim(`  ↳ run \`oauthlint explain ${f.ruleId}\` for details + the fix`));
    this.line('');
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
