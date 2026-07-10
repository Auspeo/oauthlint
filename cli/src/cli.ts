import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import pc from 'picocolors';
import { runBaseline } from './commands/baseline.js';
import { runDoctor } from './commands/doctor.js';
import { runExplain } from './commands/explain.js';
import { runInit } from './commands/init.js';
import { runList } from './commands/list.js';
import { type ScanFormat, runScan } from './commands/scan.js';
import { maybeNotifyUpdate } from './core/update-notifier.js';
import { setEngineOverride } from './engine/index.js';
import { SEVERITIES, type SeverityName } from './types.js';

interface PkgJson {
  version: string;
}

/**
 * Exit only once buffered stdout/stderr have drained.
 *
 * `process.exit()` terminates immediately and does NOT flush async writes to a
 * pipe. When output exceeds the OS pipe buffer (~64 KB on macOS) — e.g. a large
 * `--json` or `--format sarif` report piped to a file or another process — the
 * tail is silently truncated, producing invalid JSON/SARIF. Waiting for the
 * `drain` event first guarantees the whole report is written.
 */
async function exitAfterFlush(code: number): Promise<never> {
  const flush = (s: NodeJS.WriteStream): Promise<void> =>
    new Promise((res) => {
      if (s.writableLength === 0) {
        res();
        return;
      }
      // Resolve on `drain` (buffer emptied) but ALSO on `close` and `error`
      // (e.g. EPIPE when the reader goes away): the buffer may then never drain,
      // and a flush promise that can hang would deadlock `exitAfterFlush`.
      const done = (): void => res();
      s.once('drain', done);
      s.once('close', done);
      s.once('error', done);
    });
  await Promise.all([flush(process.stdout), flush(process.stderr)]);
  process.exit(code);
}

/**
 * Print the "update available" notice (when allowed) AFTER the command's normal
 * output, then exit once everything is flushed. The notifier is fire-and-forget
 * and self-suppressing: it never blocks, never touches stdout, and is silent
 * under `--json`/`--format sarif`, in CI, when piped, when `NO_UPDATE_NOTIFIER`
 * is set, or when `--no-update-check` is passed.
 */
async function finishWithNotice(
  code: number,
  ctx: { version: string; machineReadable: boolean; updateCheck: boolean },
): Promise<never> {
  await maybeNotifyUpdate({
    currentVersion: ctx.version,
    machineReadable: ctx.machineReadable,
    disabled: !ctx.updateCheck,
  });
  return exitAfterFlush(code);
}

async function readPackageVersion(): Promise<string> {
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/cli.js → ../package.json (when published)
  // src/cli.ts  → ../package.json (when running via tsx/vitest)
  for (const candidate of [
    resolve(here, '..', 'package.json'),
    resolve(here, '..', '..', 'package.json'),
  ]) {
    try {
      const pkg = JSON.parse(await readFile(candidate, 'utf8')) as PkgJson;
      if (pkg.version) return pkg.version;
    } catch {
      /* try next */
    }
  }
  return '0.0.0';
}

export async function buildProgram(): Promise<Command> {
  const program = new Command();
  const version = await readPackageVersion();

  program
    .name('oauthlint')
    .description(
      'OAuthLint — catch the OAuth/OIDC/JWT anti-patterns AI coding tools systematically produce.',
    )
    .version(version, '-v, --version')
    .option('--no-update-check', 'Do not check npm for a newer oauthlint version')
    .option(
      '--engine <path>',
      'Path to an opengrep/semgrep binary to use, skipping the automatic download (also OAUTHLINT_ENGINE)',
    );

  // Resolve the global update-check opt-out once, lazily, from the root program.
  // Commander sets `updateCheck: false` when `--no-update-check` is given.
  const updateCheckEnabled = (): boolean => program.opts().updateCheck !== false;

  // Apply the global `--engine <path>` override before any command runs, so
  // every scan path resolves that binary instead of downloading Opengrep.
  program.hook('preAction', () => {
    setEngineOverride(program.opts().engine as string | undefined);
  });

  program
    .command('scan')
    .argument('[paths...]', 'One or more files/directories to scan', ['.'])
    .description('Scan files or directories for auth misconfigurations')
    .option('--json', 'Emit JSON (shortcut for --format json)')
    .option('--format <fmt>', 'Output format: pretty | json | sarif | html', parseFormat)
    .option('--no-code-frame', 'Disable the source code frame under each finding (pretty output)')
    .option('--severity <level>', 'Only emit findings ≥ this severity', parseSeverity)
    .option(
      '--fail-on <level>',
      'Process exits non-zero if any finding ≥ this severity',
      parseFailOn,
    )
    .option(
      '--diff [ref]',
      'Scan only files changed vs a git ref (default: merge-base with the default branch)',
    )
    .option('--staged', 'Scan only git-staged files (useful for pre-commit hooks)')
    .option('--rules-dir <path>', 'Override the bundled rules directory')
    .option('--fix', 'Apply auto-fixes (rewrites source in place where possible)')
    .option(
      '--fix-dry-run',
      'Preview what --fix would change as a unified diff, without writing any files',
    )
    .option(
      '--baseline [file]',
      'Suppress findings already in a baseline file; report only NEW findings (default: .oauthlint-baseline.json)',
    )
    .action(async (paths: string[], opts: ScanCliOptions) => {
      const code = await runScan({
        paths,
        diff: opts.diff,
        staged: opts.staged,
        json: opts.json,
        format: opts.format,
        severity: opts.severity,
        failOn: opts.failOn,
        rulesDir: opts.rulesDir,
        fix: opts.fix,
        fixDryRun: opts.fixDryRun,
        baseline: opts.baseline,
        codeFrame: opts.codeFrame,
      });
      const machineReadable =
        opts.json === true ||
        opts.format === 'json' ||
        opts.format === 'sarif' ||
        opts.format === 'html';
      await finishWithNotice(code, { version, machineReadable, updateCheck: updateCheckEnabled() });
    });

  program
    .command('baseline')
    .argument('[paths...]', 'One or more files/directories to scan', ['.'])
    .description(
      'Scan and write a baseline of current findings (for adopting on an existing codebase)',
    )
    .option('-o, --output <file>', 'Where to write the baseline JSON', '.oauthlint-baseline.json')
    .option('--rules-dir <path>', 'Override the bundled rules directory')
    .action(async (paths: string[], opts: BaselineCliOptions) => {
      const code = await runBaseline({
        paths,
        output: opts.output,
        rulesDir: opts.rulesDir,
      });
      // baseline writes a JSON file but its stdout is a human summary.
      await finishWithNotice(code, {
        version,
        machineReadable: false,
        updateCheck: updateCheckEnabled(),
      });
    });

  program
    .command('list')
    .description('List every rule the current install ships with')
    .option('--json', 'Emit JSON instead of pretty output')
    .action(async (opts: { json?: boolean }) => {
      const code = await runList({ json: opts.json });
      await finishWithNotice(code, {
        version,
        machineReadable: opts.json === true,
        updateCheck: updateCheckEnabled(),
      });
    });

  program
    .command('init')
    .description('Generate a .oauthlintrc.yml at the current directory')
    .option('-f, --force', 'Overwrite an existing config file')
    .action(async (opts: { force?: boolean }) => {
      const code = await runInit({ cwd: process.cwd(), force: opts.force });
      await finishWithNotice(code, {
        version,
        machineReadable: false,
        updateCheck: updateCheckEnabled(),
      });
    });

  program
    .command('explain')
    .argument('<rule>', 'A rule id (auth.jwt.alg-none), slug (jwt-alg-none), or AUTH-JWT-001')
    .description('Explain one rule — why it matters, the fix, and vulnerable/safe examples')
    .option('--json', 'Emit the structured rule object instead of pretty output')
    .action(async (rule: string, opts: { json?: boolean }) => {
      const code = await runExplain({ rule, json: opts.json });
      await finishWithNotice(code, {
        version,
        machineReadable: opts.json === true,
        updateCheck: updateCheckEnabled(),
      });
    });

  program
    .command('doctor')
    .description('Diagnose your OAuthLint install (Node, scan engine, rule pack)')
    .option('--json', 'Emit JSON instead of pretty output')
    .action(async (opts: { json?: boolean }) => {
      const code = await runDoctor({ json: opts.json });
      await finishWithNotice(code, {
        version,
        machineReadable: opts.json === true,
        updateCheck: updateCheckEnabled(),
      });
    });

  program.showHelpAfterError(pc.dim('(run `oauthlint --help` for available commands)'));
  return program;
}

interface ScanCliOptions {
  json?: boolean;
  format?: ScanFormat;
  severity?: SeverityName;
  failOn?: SeverityName | 'off';
  // commander gives `true` for a bare `--diff`, or the string ref for `--diff <ref>`.
  diff?: string | boolean;
  staged?: boolean;
  rulesDir?: string;
  fix?: boolean;
  fixDryRun?: boolean;
  // commander gives `true` for a bare `--baseline`, or the string path for
  // `--baseline <file>`.
  baseline?: string | boolean;
  // commander sets this to `false` when `--no-code-frame` is given (default true).
  codeFrame?: boolean;
}

interface BaselineCliOptions {
  output?: string;
  rulesDir?: string;
}

function parseSeverity(v: string): SeverityName {
  const upper = v.toUpperCase() as SeverityName;
  if (!SEVERITIES.includes(upper)) {
    throw new Error(`Unknown severity "${v}". Expected one of: ${SEVERITIES.join(', ')}`);
  }
  return upper;
}

function parseFailOn(v: string): SeverityName | 'off' {
  if (v === 'off') return 'off';
  return parseSeverity(v);
}

const FORMATS = ['pretty', 'json', 'sarif', 'html'] as const;
function parseFormat(v: string): ScanFormat {
  const lower = v.toLowerCase() as ScanFormat;
  if (!(FORMATS as readonly string[]).includes(lower)) {
    throw new Error(`Unknown format "${v}". Expected one of: ${FORMATS.join(', ')}`);
  }
  return lower;
}
