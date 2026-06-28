import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type FixPlan,
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

const EMPTY_PLAN: FixPlan = { files: [], totalFixes: 0 };

// Strip ANSI so plain-text assertions hold when colour is on (CI sets
// FORCE_COLOR): picocolors styles phrases like `pc.bold('🛠 Applied')` and the
// reset code lands mid-sentence. The ESC byte is built at runtime to avoid a
// literal control char in the regex.
const ESC = String.fromCharCode(27);
const stripAnsi = (s: string): string => s.replace(new RegExp(`${ESC}\\[[0-9;]*m`, 'g'), '');

function fakeAdapter(findings: Finding[], plan: FixPlan = EMPTY_PLAN): SemgrepAdapter {
  // We only need .scan()/.planFixes() for the scan command; cast through unknown
  // to keep it type-safe.
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
    async planFixes(): Promise<FixPlan> {
      return plan;
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

const planWith = (...files: FixPlan['files']): FixPlan => ({
  files,
  totalFixes: files.reduce((n, f) => n + f.fixCount, 0),
});

describe('runScan (--fix summary)', () => {
  it('summarises which files changed and how many fixes were applied', async () => {
    const stream = new FakeStream();
    const plan = planWith({
      path: '/proj/server.ts',
      original: 'rejectUnauthorized: false\n',
      fixed: 'rejectUnauthorized: true\n',
      fixCount: 1,
    });
    await runScan({
      path: '.',
      fix: true,
      failOn: 'off',
      cwd: '/proj',
      adapter: fakeAdapter([finding('MEDIUM')], plan),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    const clean = stripAnsi(stream.buf);
    expect(clean).toContain('🛠 Applied 1 fix across 1 file');
    expect(clean).toContain('server.ts');
    // Diffs are a dry-run concern; a real fix prints a summary, not a diff.
    expect(clean).not.toContain('@@');
  });

  it('reports a no-op when --fix finds nothing to change (idempotent re-run)', async () => {
    const stream = new FakeStream();
    await runScan({
      path: '.',
      fix: true,
      failOn: 'off',
      adapter: fakeAdapter([], EMPTY_PLAN),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(stream.buf).toContain('No autofixable findings');
  });
});

describe('runScan (--fix-dry-run)', () => {
  it('prints a unified diff per file and does not apply (no summary)', async () => {
    const stream = new FakeStream();
    const plan = planWith({
      path: '/proj/agent.ts',
      original: 'const a = 1;\nrejectUnauthorized: false\nconst b = 2;\n',
      fixed: 'const a = 1;\nrejectUnauthorized: true\nconst b = 2;\n',
      fixCount: 1,
    });
    await runScan({
      path: '.',
      fixDryRun: true,
      failOn: 'off',
      cwd: '/proj',
      adapter: fakeAdapter([finding('HIGH')], plan),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    const clean = stripAnsi(stream.buf);
    expect(clean).toContain('Fix preview');
    expect(clean).toContain('dry run');
    expect(clean).toContain('--- a/agent.ts');
    expect(clean).toContain('+++ b/agent.ts');
    expect(clean).toContain('-rejectUnauthorized: false');
    expect(clean).toContain('+rejectUnauthorized: true');
    expect(clean).toContain('Re-run with --fix');
    // A dry run must not print the "Applied" summary.
    expect(clean).not.toContain('🛠 Applied');
  });

  it('dry-run wins over --fix: nothing is applied when both are set', async () => {
    const stream = new FakeStream();
    let applied = false;
    const plan = planWith({
      path: '/proj/x.ts',
      original: 'a\n',
      fixed: 'b\n',
      fixCount: 1,
    });
    const adapter = {
      async scan(_t: unknown, o: { applyFixes?: boolean } = {}) {
        if (o.applyFixes) applied = true;
        return { findings: [], scannedFiles: 1, durationMs: 1, semgrepVersion: '1', errors: [] };
      },
      async planFixes() {
        return plan;
      },
      async getVersion() {
        return '1';
      },
    } as unknown as SemgrepAdapter;
    await runScan({
      path: '.',
      fix: true,
      fixDryRun: true,
      failOn: 'off',
      cwd: '/proj',
      adapter,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(applied).toBe(false);
    expect(stream.buf).toContain('Fix preview');
  });

  it('notes when there is nothing to preview', async () => {
    const stream = new FakeStream();
    await runScan({
      path: '.',
      fixDryRun: true,
      failOn: 'off',
      adapter: fakeAdapter([], EMPTY_PLAN),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(stream.buf).toContain('nothing to preview');
  });
});

describe('runScan (pretty extras)', () => {
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
