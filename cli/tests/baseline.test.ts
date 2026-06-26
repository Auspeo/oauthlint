import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SemgrepAdapter } from '../src/adapters/semgrep.js';
import { runBaseline } from '../src/commands/baseline.js';
import { runScan } from '../src/commands/scan.js';
import {
  BASELINE_VERSION,
  type BaselineFile,
  DEFAULT_BASELINE_FILE,
  buildBaseline,
  fingerprintFindings,
  loadBaseline,
  partitionByBaseline,
} from '../src/core/baseline.js';
import type { Finding, ScanResult } from '../src/types.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

function fakeAdapter(findings: Finding[]): SemgrepAdapter {
  return {
    async scan(): Promise<ScanResult> {
      return {
        findings,
        scannedFiles: 1,
        durationMs: 1,
        semgrepVersion: '1.0.0',
        errors: [],
      };
    },
    async getVersion() {
      return '1.0.0';
    },
  } as unknown as SemgrepAdapter;
}

const stream = (): NodeJS.WritableStream => new FakeStream() as unknown as NodeJS.WritableStream;

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'oauthlint-baseline-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

/** Write a source file under the temp dir and return an absolute-path finding for it. */
async function fixtureFinding(
  file: string,
  contents: string,
  startLine: number,
  overrides: Partial<Finding> = {},
): Promise<Finding> {
  await writeFile(join(dir, file), contents);
  return {
    ruleId: 'auth.jwt.alg-none',
    oauthlintRuleId: 'AUTH-JWT-001',
    severity: 'HIGH',
    filePath: join(dir, file),
    startLine,
    endLine: startLine,
    message: 'JWT alg:none accepted',
    ...overrides,
  };
}

describe('baseline write/read round-trip', () => {
  it('writes a versioned, diffable file and loads back the same fingerprints', async () => {
    const f = await fixtureFinding('a.ts', 'const a = 1;\njwt.verify(t, k, "none");\n', 2);
    const code = await runBaseline({ cwd: dir, adapter: fakeAdapter([f]), stream: stream() });
    expect(code).toBe(0);

    const raw = await readFile(join(dir, DEFAULT_BASELINE_FILE), 'utf8');
    const parsed = JSON.parse(raw) as BaselineFile;
    expect(parsed.version).toBe(BASELINE_VERSION);
    expect(typeof parsed.generatedAt).toBe('string');
    expect(parsed.findings).toHaveLength(1);
    // Human-diffable: relative path, not the absolute temp path.
    expect(parsed.findings[0].filePath).toBe('a.ts');
    expect(parsed.findings[0].ruleId).toBe('AUTH-JWT-001');

    const loaded = await loadBaseline(join(dir, DEFAULT_BASELINE_FILE));
    expect(loaded.fingerprints.has(parsed.findings[0].fingerprint)).toBe(true);
  });

  it('prints how many findings were baselined', async () => {
    const f1 = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    const out = new FakeStream();
    await runBaseline({
      cwd: dir,
      adapter: fakeAdapter([f1]),
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(out.buf).toContain('Baselined 1 finding');
  });

  it('honours --output for the baseline path', async () => {
    const f = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    await runBaseline({
      cwd: dir,
      output: 'custom-baseline.json',
      adapter: fakeAdapter([f]),
      stream: stream(),
    });
    const raw = await readFile(join(dir, 'custom-baseline.json'), 'utf8');
    expect((JSON.parse(raw) as BaselineFile).findings).toHaveLength(1);
  });
});

describe('scan --baseline suppression', () => {
  it('suppresses baselined findings and surfaces a genuinely new one', async () => {
    const known = await fixtureFinding('a.ts', 'const a = 1;\njwt.verify(t, k, "none");\n', 2);
    await runBaseline({ cwd: dir, adapter: fakeAdapter([known]), stream: stream() });

    // Scan now sees the known finding PLUS a new one in another file.
    await writeFile(join(dir, 'b.ts'), 'cookie.set("s", v);\n');
    const newFinding: Finding = {
      ruleId: 'auth.cookie.no-secure',
      oauthlintRuleId: 'AUTH-COOKIE-001',
      severity: 'CRITICAL',
      filePath: join(dir, 'b.ts'),
      startLine: 1,
      endLine: 1,
      message: 'Cookie set without Secure',
    };

    const out = new FakeStream();
    const code = await runScan({
      cwd: dir,
      baseline: true,
      failOn: 'HIGH',
      adapter: fakeAdapter([known, newFinding]),
      stream: out as unknown as NodeJS.WritableStream,
    });

    // The new CRITICAL gates the exit code; the baselined HIGH does not appear.
    expect(code).toBe(2);
    expect(out.buf).toContain('auth.cookie.no-secure');
    expect(out.buf).not.toContain('auth.jwt.alg-none');
    expect(out.buf).toContain('already in the baseline');
  });

  it('exit code ignores baselined findings (only new ones gate)', async () => {
    const known = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    await runBaseline({ cwd: dir, adapter: fakeAdapter([known]), stream: stream() });

    const out = new FakeStream();
    // Only the baselined HIGH is present — nothing new, so exit 0 despite failOn HIGH.
    const code = await runScan({
      cwd: dir,
      baseline: true,
      failOn: 'HIGH',
      adapter: fakeAdapter([known]),
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
  });
});

describe('fingerprint resilience', () => {
  it('stays suppressed when the finding moves down N lines (code unchanged)', async () => {
    const original = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    await runBaseline({ cwd: dir, adapter: fakeAdapter([original]), stream: stream() });

    // Insert 5 blank lines above; the flagged code is now on line 6 — same text.
    await writeFile(join(dir, 'a.ts'), `${'\n'.repeat(5)}jwt.verify(t, k, "none");\n`);
    const shifted: Finding = { ...original, startLine: 6, endLine: 6 };

    const out = new FakeStream();
    const code = await runScan({
      cwd: dir,
      baseline: true,
      failOn: 'HIGH',
      adapter: fakeAdapter([shifted]),
      stream: out as unknown as NodeJS.WritableStream,
    });
    // Still baselined — moving lines does not resurface it.
    expect(code).toBe(0);
    expect(out.buf).not.toContain('auth.jwt.alg-none');
  });

  it('surfaces a finding as new when the flagged code changes', async () => {
    const original = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    await runBaseline({ cwd: dir, adapter: fakeAdapter([original]), stream: stream() });

    // Same rule + file + line, but the matched code is different.
    await writeFile(join(dir, 'a.ts'), 'jwt.verify(t, k, ["none","HS256"]);\n');
    const changed: Finding = { ...original, message: 'JWT alg:none accepted' };

    const out = new FakeStream();
    const code = await runScan({
      cwd: dir,
      baseline: true,
      failOn: 'HIGH',
      adapter: fakeAdapter([changed]),
      stream: out as unknown as NodeJS.WritableStream,
    });
    // Code changed → new finding → HIGH gates exit 1.
    expect(code).toBe(1);
    expect(out.buf).toContain('auth.jwt.alg-none');
  });
});

describe('fingerprint determinism & disambiguation', () => {
  it('produces identical fingerprints for identical inputs', async () => {
    const f = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    const a = await fingerprintFindings([f], dir);
    const b = await fingerprintFindings([f], dir);
    expect(a[0].fingerprint).toBe(b[0].fingerprint);
  });

  it('disambiguates the same fingerprint occurring multiple times in a file', async () => {
    // Two identical anti-patterns on different lines with the SAME normalised
    // snippet → same base fingerprint, distinct occurrence indices.
    await writeFile(join(dir, 'a.ts'), 'jwt.verify(t, k, "none");\njwt.verify(t, k, "none");\n');
    const f1: Finding = {
      ruleId: 'auth.jwt.alg-none',
      oauthlintRuleId: 'AUTH-JWT-001',
      severity: 'HIGH',
      filePath: join(dir, 'a.ts'),
      startLine: 1,
      endLine: 1,
      message: 'x',
    };
    const f2: Finding = { ...f1, startLine: 2, endLine: 2 };
    const fps = await fingerprintFindings([f1, f2], dir);
    expect(fps).toHaveLength(2);
    expect(fps[0].fingerprint).not.toBe(fps[1].fingerprint);
    // Both share the same base hash, differing only in the `:n` index.
    const [base0] = fps[0].fingerprint.split(':');
    const [base1] = fps[1].fingerprint.split(':');
    expect(base0).toBe(base1);
  });

  it('does not depend on absolute path / cwd', async () => {
    await writeFile(join(dir, 'a.ts'), 'jwt.verify(t, k, "none");\n');
    const abs: Finding = {
      ruleId: 'auth.jwt.alg-none',
      oauthlintRuleId: 'AUTH-JWT-001',
      severity: 'HIGH',
      filePath: join(dir, 'a.ts'),
      startLine: 1,
      endLine: 1,
      message: 'x',
    };
    const rel: Finding = { ...abs, filePath: 'a.ts' };
    const fromAbs = await fingerprintFindings([abs], dir);
    const fromRel = await fingerprintFindings([rel], dir);
    expect(fromAbs[0].fingerprint).toBe(fromRel[0].fingerprint);
  });
});

describe('missing / malformed baseline file', () => {
  it('scan --baseline errors clearly when the file is missing (exit 2)', async () => {
    const out = new FakeStream();
    const code = await runScan({
      cwd: dir,
      baseline: true,
      adapter: fakeAdapter([]),
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(2);
    expect(out.buf).toContain('Baseline file not found');
  });

  it('scan --baseline errors on a malformed baseline file (exit 2)', async () => {
    await writeFile(join(dir, DEFAULT_BASELINE_FILE), 'not json at all');
    const out = new FakeStream();
    const code = await runScan({
      cwd: dir,
      baseline: true,
      adapter: fakeAdapter([]),
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(2);
    expect(out.buf).toContain('Could not parse baseline file');
  });

  it('loadBaseline throws for a missing file (not treated as empty)', async () => {
    await expect(loadBaseline(join(dir, 'nope.json'))).rejects.toThrow('Baseline file not found');
  });
});

describe('graceful file handling', () => {
  it('still fingerprints when the source file is missing (degrades to message)', async () => {
    const f: Finding = {
      ruleId: 'auth.jwt.alg-none',
      oauthlintRuleId: 'AUTH-JWT-001',
      severity: 'HIGH',
      filePath: join(dir, 'gone.ts'),
      startLine: 10,
      endLine: 10,
      message: 'JWT alg:none accepted',
    };
    const fps = await fingerprintFindings([f], dir);
    expect(fps).toHaveLength(1);
    expect(typeof fps[0].fingerprint).toBe('string');
  });

  it('partitionByBaseline round-trips against a freshly built baseline', async () => {
    const f = await fixtureFinding('a.ts', 'jwt.verify(t, k, "none");\n', 1);
    const file = await buildBaseline([f], dir);
    const baseline = { fingerprints: new Set(file.findings.map((e) => e.fingerprint)) };
    const { newFindings, baselined } = await partitionByBaseline([f], baseline, dir);
    expect(newFindings).toHaveLength(0);
    expect(baselined).toHaveLength(1);
  });
});
