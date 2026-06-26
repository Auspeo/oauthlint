import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SemgrepAdapter } from '../src/adapters/semgrep.js';
import { runScan } from '../src/commands/scan.js';
import type { ScanResult } from '../src/types.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

/**
 * Adapter that records the targets handed to `.scan()` so we can assert the
 * incremental change-set resolution without invoking real semgrep.
 */
function spyAdapter(): { adapter: SemgrepAdapter; calls: Array<string | string[]> } {
  const calls: Array<string | string[]> = [];
  const adapter = {
    async scan(target: string | string[]): Promise<ScanResult> {
      calls.push(target);
      return { findings: [], scannedFiles: 0, durationMs: 1, semgrepVersion: '1.0.0', errors: [] };
    },
    async getVersion() {
      return '1.0.0';
    },
  } as unknown as SemgrepAdapter;
  return { adapter, calls };
}

async function git(cwd: string, ...args: string[]): Promise<void> {
  await execa('git', args, { cwd });
}

async function makeRepo(): Promise<string> {
  // Resolve the real path so it matches git's canonical toplevel (see
  // changed-files.test.ts for the macOS /var → /private/var rationale).
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'oauthlint-inc-')));
  await git(dir, 'init', '-q', '-b', 'main');
  await git(dir, 'config', 'user.email', 'test@oauthlint.dev');
  await git(dir, 'config', 'user.name', 'Test');
  await git(dir, 'config', 'commit.gpgsign', 'false');
  await writeFile(join(dir, 'base.ts'), 'export const base = 1;\n');
  await git(dir, 'add', '.');
  await git(dir, 'commit', '-q', '-m', 'initial');
  return dir;
}

describe('runScan — explicit path args', () => {
  it('passes every path arg through to the adapter (absolute)', async () => {
    const { adapter, calls } = spyAdapter();
    const stream = new FakeStream();
    const code = await runScan({
      paths: ['src/a.ts', 'src/b.ts'],
      cwd: '/repo',
      failOn: 'off',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual(['/repo/src/a.ts', '/repo/src/b.ts']);
  });

  it('defaults to the current dir when no path is given', async () => {
    const { adapter, calls } = spyAdapter();
    const stream = new FakeStream();
    await runScan({
      cwd: '/repo',
      failOn: 'off',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(calls[0]).toEqual(['/repo']);
  });
});

describe('runScan — incremental (--staged / --diff)', () => {
  let repo: string;
  beforeEach(async () => {
    repo = await makeRepo();
  });
  afterEach(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  it('--staged scans only staged source files', async () => {
    await writeFile(join(repo, 'staged.ts'), 'export const a = 1;\n');
    await writeFile(join(repo, 'skip.md'), '# doc\n');
    await git(repo, 'add', 'staged.ts', 'skip.md');

    const { adapter, calls } = spyAdapter();
    const stream = new FakeStream();
    const code = await runScan({
      staged: true,
      cwd: repo,
      failOn: 'off',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(calls[0]).toEqual([join(repo, 'staged.ts')]);
  });

  it('--diff <ref> scans only changed source files vs the ref', async () => {
    const base = (await execa('git', ['rev-parse', 'HEAD'], { cwd: repo })).stdout.trim();
    await writeFile(join(repo, 'changed.ts'), 'export const c = 1;\n');

    const { adapter, calls } = spyAdapter();
    const stream = new FakeStream();
    const code = await runScan({
      diff: base,
      cwd: repo,
      failOn: 'off',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(calls[0]).toEqual([join(repo, 'changed.ts')]);
  });

  it('exits 0 with a clear message when the change set is empty', async () => {
    const { adapter, calls } = spyAdapter();
    const stream = new FakeStream();
    const code = await runScan({
      staged: true, // nothing staged
      cwd: repo,
      failOn: 'HIGH',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(stream.buf).toContain('No changed files to scan');
    // The adapter is never invoked when there's nothing to scan.
    expect(calls).toHaveLength(0);
  });

  it('emits empty JSON (not the no-files message) when --json + empty change set', async () => {
    const { adapter } = spyAdapter();
    const stream = new FakeStream();
    const code = await runScan({
      staged: true,
      json: true,
      cwd: repo,
      failOn: 'off',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    const payload = JSON.parse(stream.buf) as { findings: unknown[] };
    expect(payload.findings).toEqual([]);
  });
});

describe('runScan — incremental outside a git repo', () => {
  it('--diff returns a graceful error (exit 2, no crash) when not in a repo', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'oauthlint-nogit-'));
    try {
      const { adapter, calls } = spyAdapter();
      const stream = new FakeStream();
      const code = await runScan({
        diff: true,
        cwd: dir,
        failOn: 'off',
        adapter,
        stream: stream as unknown as NodeJS.WritableStream,
      });
      expect(code).toBe(2);
      expect(stream.buf).toContain('Not a git repository');
      expect(calls).toHaveLength(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
