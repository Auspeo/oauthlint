import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import pc from 'picocolors';
import { runDoctor } from './commands/doctor.js';
import { runInit } from './commands/init.js';
import { runList } from './commands/list.js';
import { type ScanFormat, runScan } from './commands/scan.js';
import { SEVERITIES, type SeverityName } from './types.js';

interface PkgJson {
  version: string;
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
    .version(version, '-v, --version');

  program
    .command('scan')
    .argument('[path]', 'Path to scan', '.')
    .description('Scan a directory for auth misconfigurations')
    .option('--json', 'Emit JSON (shortcut for --format json)')
    .option('--format <fmt>', 'Output format: pretty | json | sarif', parseFormat)
    .option('--severity <level>', 'Only emit findings ≥ this severity', parseSeverity)
    .option(
      '--fail-on <level>',
      'Process exits non-zero if any finding ≥ this severity',
      parseFailOn,
    )
    .option('--rules-dir <path>', 'Override the bundled rules directory')
    .option('--fix', 'Apply auto-fixes (rewrites source in place where possible)')
    .action(async (path: string, opts: ScanCliOptions) => {
      const code = await runScan({
        path,
        json: opts.json,
        format: opts.format,
        severity: opts.severity,
        failOn: opts.failOn,
        rulesDir: opts.rulesDir,
        fix: opts.fix,
      });
      process.exit(code);
    });

  program
    .command('list')
    .description('List every rule the current install ships with')
    .option('--json', 'Emit JSON instead of pretty output')
    .action(async (opts: { json?: boolean }) => {
      process.exit(await runList({ json: opts.json }));
    });

  program
    .command('init')
    .description('Generate a .oauthlintrc.yml at the current directory')
    .option('-f, --force', 'Overwrite an existing config file')
    .action(async (opts: { force?: boolean }) => {
      process.exit(await runInit({ cwd: process.cwd(), force: opts.force }));
    });

  program
    .command('doctor')
    .description('Diagnose your OAuthLint install (Node, Semgrep, rule pack)')
    .option('--json', 'Emit JSON instead of pretty output')
    .action(async (opts: { json?: boolean }) => {
      process.exit(await runDoctor({ json: opts.json }));
    });

  program.showHelpAfterError(pc.dim('(run `oauthlint --help` for available commands)'));
  return program;
}

interface ScanCliOptions {
  json?: boolean;
  format?: ScanFormat;
  severity?: SeverityName;
  failOn?: SeverityName | 'off';
  rulesDir?: string;
  fix?: boolean;
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

const FORMATS = ['pretty', 'json', 'sarif'] as const;
function parseFormat(v: string): ScanFormat {
  const lower = v.toLowerCase() as ScanFormat;
  if (!(FORMATS as readonly string[]).includes(lower)) {
    throw new Error(`Unknown format "${v}". Expected one of: ${FORMATS.join(', ')}`);
  }
  return lower;
}
