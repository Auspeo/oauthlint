import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepOutputError,
} from '../src/adapters/semgrep.js';
import { runScan } from '../src/commands/scan.js';
import type { Finding, ScanResult } from '../src/types.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

function fakeAdapter(findings: Finding[]): SemgrepAdapter {
  // We only need .scan() for the scan command; cast through unknown to keep it type-safe.
  return {
    async scan(): Promise<ScanResult> {
      return {
        findings,
        scannedFiles: 5,
        durationMs: 12,
        semgrepVersion: '1.0.0',
        errors: [],
      };
    },
    async getVersion() {
      return '1.0.0';
    },
  } as unknown as SemgrepAdapter;
}

const finding = (sev: Finding['severity']): Finding => ({
  ruleId: `auth.test.${sev.toLowerCase()}`,
  severity: sev,
  filePath: 'a.ts',
  startLine: 1,
  endLine: 1,
  message: 'lorem ipsum dolor sit amet, consectetur adipiscing elit',
});

describe('runScan (exit codes)', () => {
  it('returns 0 when no findings', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      adapter: fakeAdapter([]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
  });

  it('returns 0 when findings are below the failOn threshold', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      failOn: 'HIGH',
      adapter: fakeAdapter([finding('MEDIUM'), finding('LOW')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
  });

  it('returns 1 when there is at least one HIGH finding', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      failOn: 'HIGH',
      adapter: fakeAdapter([finding('HIGH'), finding('LOW')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(1);
  });

  it('returns 2 when there is at least one CRITICAL finding', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      failOn: 'HIGH',
      adapter: fakeAdapter([finding('CRITICAL'), finding('HIGH')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(2);
  });

  it('respects --severity filtering before computing exit code', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      severity: 'CRITICAL',
      failOn: 'HIGH',
      adapter: fakeAdapter([finding('HIGH')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    // After filtering, no CRITICAL → exit 0.
    expect(code).toBe(0);
  });

  it('honours failOn=off (CI-only mode that never fails the build)', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      failOn: 'off',
      adapter: fakeAdapter([finding('CRITICAL')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
  });
});

describe('runScan (JSON mode)', () => {
  it('emits valid JSON', async () => {
    const stream = new FakeStream();
    await runScan({
      path: '.',
      json: true,
      failOn: 'off',
      adapter: fakeAdapter([finding('MEDIUM')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    const payload = JSON.parse(stream.buf) as Record<string, unknown>;
    expect(payload.schemaVersion).toBe('oauthlint-v1');
    const findings = payload.findings as Finding[];
    expect(findings).toHaveLength(1);
  });
});

function throwingAdapter(err: Error): SemgrepAdapter {
  return {
    async scan(): Promise<ScanResult> {
      throw err;
    },
    async getVersion() {
      return null;
    },
  } as unknown as SemgrepAdapter;
}

describe('runScan (error handling)', () => {
  it('returns 127 and prints guidance when Semgrep is not installed', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      adapter: throwingAdapter(new SemgrepNotInstalledError()),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(127);
    expect(stream.buf).toContain('Semgrep is not installed');
  });

  it('returns 2 and prints guidance when Semgrep output cannot be parsed', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      adapter: throwingAdapter(new SemgrepOutputError('Unexpected end of JSON input')),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(2);
    expect(stream.buf).toContain('Could not parse Semgrep output');
  });

  it('re-throws unexpected adapter errors', async () => {
    const stream = new FakeStream();
    await expect(
      runScan({
        path: '.',
        adapter: throwingAdapter(new Error('boom')),
        stream: stream as unknown as NodeJS.WritableStream,
      }),
    ).rejects.toThrow('boom');
  });

  it('treats a missing rules directory as zero rules (pretty header)', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      failOn: 'off',
      rulesDir: '/no/such/rules/dir',
      adapter: fakeAdapter([]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(stream.buf).toContain('scanning');
  });
});

describe('runScan (SARIF mode)', () => {
  it('emits a SARIF document', async () => {
    const stream = new FakeStream();
    await runScan({
      path: '.',
      format: 'sarif',
      failOn: 'off',
      adapter: fakeAdapter([finding('HIGH')]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    const sarif = JSON.parse(stream.buf) as { runs?: unknown[] };
    expect(Array.isArray(sarif.runs)).toBe(true);
  });
});

describe('runScan (pretty extras)', () => {
  it('prints the auto-fix hint when --fix is set', async () => {
    const stream = new FakeStream();
    const cookieFinding: Finding = { ...finding('MEDIUM'), ruleId: 'auth.cookie.no-secure' };
    await runScan({
      path: '.',
      fix: true,
      failOn: 'off',
      adapter: fakeAdapter([cookieFinding]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(stream.buf).toContain('Auto-fix applied');
  });

  it('reports how many findings were suppressed by inline directives', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'oauthlint-scan-'));
    const file = join(dir, 'server.ts');
    await writeFile(
      file,
      [
        'const a = 1;',
        '// oauthlint-disable-next-line auth.cookie.no-secure',
        'setCookie();',
        '',
      ].join('\n'),
    );
    const stream = new FakeStream();
    const suppressed: Finding = {
      ...finding('MEDIUM'),
      ruleId: 'auth.cookie.no-secure',
      filePath: file,
      startLine: 3,
      endLine: 3,
    };
    await runScan({
      path: '.',
      failOn: 'off',
      adapter: fakeAdapter([suppressed]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(stream.buf).toContain('suppressed via inline directives');
    await rm(dir, { recursive: true, force: true });
  });
});
