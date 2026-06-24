import { resolve } from 'node:path';
import { RULES_ROOT } from 'oauthlint-rules';
import {
  SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepOutputError,
} from '../adapters/semgrep.js';
import { loadConfig } from '../core/config.js';
import { Reporter } from '../core/reporter.js';
import { toSarif } from '../core/sarif.js';
import { exitCodeFor, highestSeverity, meetsThreshold } from '../core/severity.js';
import { applySuppressions } from '../core/suppress.js';
import type { Finding, SeverityName } from '../types.js';

export type ScanFormat = 'pretty' | 'json' | 'sarif';

export interface ScanCommandOptions {
  path: string;
  /** Legacy boolean — equivalent to `format: 'json'`. */
  json?: boolean;
  /** Output format. Overrides `json` when set. */
  format?: ScanFormat;
  severity?: SeverityName;
  failOn?: SeverityName | 'off';
  rulesDir?: string;
  /**
   * Apply auto-fixes (rewrites source files in place) for rules that
   * ship a `fix:` template. Currently the cookie-* rules.
   */
  fix?: boolean;
  /** Used by tests to inject a mock adapter. */
  adapter?: SemgrepAdapter;
  /** Used by tests to capture output. */
  stream?: NodeJS.WritableStream;
}

export async function runScan(opts: ScanCommandOptions): Promise<number> {
  const target = resolve(opts.path);
  const config = await loadConfig(target);
  const rulesDir = opts.rulesDir ?? config.customRulesDir ?? RULES_ROOT;
  const failOn = opts.failOn ?? config.failOn ?? 'HIGH';
  const format: ScanFormat = opts.format ?? (opts.json ? 'json' : 'pretty');
  const stream = opts.stream ?? process.stdout;

  const reporter = new Reporter({ json: format === 'json', stream });
  if (format === 'pretty') reporter.reportStart(target, await countRuleFiles(rulesDir));

  const adapter = opts.adapter ?? new SemgrepAdapter({ configPath: rulesDir });
  let result: Awaited<ReturnType<SemgrepAdapter['scan']>>;
  try {
    result = await adapter.scan(target, { applyFixes: opts.fix });
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

  if (format === 'sarif') {
    const sarif = await toSarif({ ...result, findings });
    stream.write(`${JSON.stringify(sarif, null, 2)}\n`);
  } else {
    reporter.reportResult({ ...result, findings });
    if (opts.fix && format === 'pretty') {
      const fixed = findings.filter((f) => f.ruleId.startsWith('auth.cookie.')).length;
      stream.write(
        `\n🛠 Auto-fix applied where possible — re-run \`oauthlint scan\` to confirm.${fixed > 0 ? ` (${fixed} cookie-* finding${fixed === 1 ? '' : 's'} eligible.)` : ''}\n`,
      );
    }
    if (suppressed.length > 0 && format === 'pretty') {
      stream.write(
        `\nℹ ${suppressed.length} finding${
          suppressed.length === 1 ? '' : 's'
        } suppressed via inline directives.\n`,
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
