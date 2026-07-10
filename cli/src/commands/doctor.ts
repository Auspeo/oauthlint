import { buildManifest } from 'oauthlint-rules';
import pc from 'picocolors';
import { SemgrepAdapter } from '../adapters/semgrep.js';
import { EngineUnavailableError, type ResolvedEngine, resolveEngine } from '../engine/index.js';

export interface DoctorOptions {
  stream?: NodeJS.WritableStream;
  /** When true, emit JSON instead of pretty output. */
  json?: boolean;
  /**
   * Resolve the scan engine (installed opengrep/semgrep or the pinned Opengrep
   * download). Injectable so tests can exercise doctor without touching the
   * network. Defaults to the shared engine manager.
   */
  resolve?: () => Promise<ResolvedEngine>;
}

interface Check {
  name: string;
  status: 'ok' | 'warn' | 'fail';
  details: string;
}

/** Human-readable label for where a resolved engine came from. */
function sourceLabel(source: ResolvedEngine['source']): string {
  switch (source) {
    case 'override':
      return 'from OAUTHLINT_ENGINE/--engine';
    case 'path':
      return 'found on PATH';
    case 'cache':
      return 'downloaded (cached)';
    case 'download':
      return 'downloaded';
  }
}

export async function runDoctor(opts: DoctorOptions = {}): Promise<number> {
  const out = opts.stream ?? process.stdout;
  const resolve = opts.resolve ?? resolveEngine;
  const checks: Check[] = [];

  checks.push({
    name: 'Node.js runtime',
    status: nodeOk() ? 'ok' : 'warn',
    details: `${process.version} (≥ v20 required)`,
  });

  try {
    const engine = await resolve();
    const adapter = new SemgrepAdapter({
      configPath: 'unused',
      binary: engine.path,
      metrics: engine.engine === 'semgrep',
    });
    const version = (await adapter.getVersion()) ?? 'unknown version';
    checks.push({
      name: 'Scan engine',
      status: 'ok',
      details: `${engine.engine} ${version} (${sourceLabel(engine.source)}) — ${engine.path}`,
    });
  } catch (err) {
    const detail =
      err instanceof EngineUnavailableError
        ? err.message
        : `could not resolve a scan engine: ${(err as Error).message}`;
    checks.push({ name: 'Scan engine', status: 'fail', details: detail });
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
