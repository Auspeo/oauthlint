import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { RULES_ROOT } from 'oauthlint-rules';
import pc from 'picocolors';
import {
  SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepOutputError,
} from '../adapters/semgrep.js';
import { DEFAULT_BASELINE_FILE, buildBaseline, serialiseBaseline } from '../core/baseline.js';
import { loadConfig } from '../core/config.js';
import { applySuppressions } from '../core/suppress.js';
import type { Finding } from '../types.js';

export interface BaselineCommandOptions {
  /** Path(s) to scan when capturing the baseline. Defaults to `['.']`. */
  paths?: string[];
  /** Where to write the baseline JSON. Defaults to `.oauthlint-baseline.json`. */
  output?: string;
  rulesDir?: string;
  /** Used by tests to inject a mock adapter. */
  adapter?: SemgrepAdapter;
  /** Used by tests to capture output. */
  stream?: NodeJS.WritableStream;
  /** Override the directory git/relative paths resolve from (defaults to cwd). */
  cwd?: string;
}

/**
 * `oauthlint baseline [paths...]` — scan the codebase and write a baseline file
 * capturing the CURRENT findings by stable fingerprint, so a later
 * `scan --baseline` only surfaces NEW findings.
 */
export async function runBaseline(opts: BaselineCommandOptions): Promise<number> {
  const cwd = opts.cwd ?? process.cwd();
  const config = await loadConfig(cwd);
  const rulesDir = opts.rulesDir ?? config.customRulesDir ?? RULES_ROOT;
  const stream = opts.stream ?? process.stdout;
  const errStream = opts.stream ?? process.stderr;

  const requested = opts.paths?.length ? opts.paths : ['.'];
  const targets = requested.map((p) => resolve(cwd, p));

  const adapter = opts.adapter ?? new SemgrepAdapter({ configPath: rulesDir });
  let result: Awaited<ReturnType<SemgrepAdapter['scan']>>;
  try {
    result = await adapter.scan(targets);
  } catch (err) {
    if (err instanceof SemgrepNotInstalledError) {
      errStream.write(`${err.message}\n`);
      return 127;
    }
    if (err instanceof SemgrepOutputError) {
      errStream.write(`${err.message}\n`);
      return 2;
    }
    throw err;
  }

  // Honour inline suppression directives so the baseline mirrors what `scan`
  // would actually report (we don't want to baseline already-suppressed noise).
  const { kept } = await applySuppressions(result.findings);
  const findings: Finding[] = kept;

  const outputPath = resolve(cwd, opts.output ?? DEFAULT_BASELINE_FILE);
  const baseline = await buildBaseline(findings, cwd);
  await writeFile(outputPath, serialiseBaseline(baseline), 'utf8');

  const n = baseline.findings.length;
  stream.write(
    pc.green(
      `✓ Baselined ${n} finding${n === 1 ? '' : 's'} → ${opts.output ?? DEFAULT_BASELINE_FILE}\n`,
    ),
  );
  stream.write(
    pc.dim(
      `Future runs of ${pc.bold('oauthlint scan --baseline')} will report only NEW findings.\n`,
    ),
  );
  return 0;
}
