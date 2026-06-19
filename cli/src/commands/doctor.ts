import { buildManifest } from 'oauthlint-rules';
import pc from 'picocolors';
import { SemgrepAdapter } from '../adapters/semgrep.js';

export interface DoctorOptions {
  binary?: string;
  stream?: NodeJS.WritableStream;
  /** When true, emit JSON instead of pretty output. */
  json?: boolean;
}

interface Check {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
}

export async function runDoctor(opts: DoctorOptions = {}): Promise<number> {
  const out = opts.stream ?? process.stdout;
  const checks: Check[] = [];

  checks.push({
    name: 'Node.js runtime',
    status: nodeOk() ? 'ok' : 'warn',
    details: `${process.version} (≥ v20 required)`,
  });

  const adapter = new SemgrepAdapter({ configPath: 'unused', binary: opts.binary });
  const semgrepVersion = await adapter.getVersion();
  if (semgrepVersion) {
    checks.push({
      name: 'Semgrep CLI',
      status: 'ok',
      details: semgrepVersion,
    });
  } else {
    checks.push({
      name: 'Semgrep CLI',
      status: 'fail',
      details: 'not found on PATH — install with `pipx install semgrep` or `brew install semgrep`',
    });
  }

  try {
    const manifest = await buildManifest();
    checks.push({
      name: 'OAuthLint rule pack',
      status: manifest.length >= 20 ? 'ok' : 'warn',
      details: `${manifest.length} rules loaded`,
    });
  } catch (err) {
    checks.push({
      name: 'OAuthLint rule pack',
      status: 'fail',
      details: `failed to load: ${(err as Error).message}`,
    });
  }

  if (opts.json) {
    out.write(`${JSON.stringify({ checks }, null, 2)}\n`);
  } else {
    out.write(pc.bold('OAuthLint — environment check\n'));
    out.write(`${pc.dim('─'.repeat(60))}\n`);
    for (const c of checks) {
      out.write(`${badge(c.status)} ${c.name.padEnd(20, ' ')} ${pc.dim(c.details)}\n`);
    }
  }

  return checks.some((c) => c.status === 'fail') ? 1 : 0;
}

function nodeOk(): boolean {
  const major = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
  return major >= 20;
}

function badge(status: Check['status']): string {
  switch (status) {
    case 'ok':
      return pc.green(' ✓ ');
    case 'warn':
      return pc.yellow(' ! ');
    case 'fail':
      return pc.red(' ✗ ');
  }
}
