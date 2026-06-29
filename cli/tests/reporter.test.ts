import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Reporter } from '../src/core/reporter.js';
import type { Finding, ScanResult } from '../src/types.js';

// Strip ANSI before asserting so colour boundaries never make `toContain` flaky.
const ESC = String.fromCharCode(27);
const stripAnsi = (s: string): string => s.replace(new RegExp(`${ESC}\\[[0-9;]*m`, 'g'), '');

class StringStream {
  private chunks: string[] = [];
  write(chunk: string | Uint8Array): boolean {
    this.chunks.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8'));
    return true;
  }
  toString(): string {
    return this.chunks.join('');
  }
}

const baseResult = (findings: Finding[] = []): ScanResult => ({
  findings,
  scannedFiles: 12,
  durationMs: 87,
  semgrepVersion: '1.50.0',
  errors: [],
});

describe('Reporter (pretty)', () => {
  it('reports clean scans with a friendly message', () => {
    const out = new StringStream();
    const reporter = new Reporter({ stream: out as unknown as NodeJS.WritableStream });
    reporter.reportResult(baseResult());
    const text = out.toString();
    expect(text).toContain('No auth issues found');
    expect(text).toContain('12 files');
  });

  it('prints rule id, file:line, and doc URL for each finding', () => {
    const out = new StringStream();
    const reporter = new Reporter({ stream: out as unknown as NodeJS.WritableStream });
    const finding: Finding = {
      ruleId: 'auth.jwt.alg-none',
      oauthlintRuleId: 'AUTH-JWT-001',
      severity: 'HIGH',
      filePath: 'src/auth/jwt.ts',
      startLine: 14,
      endLine: 14,
      message: 'JWT alg: none accepted.\nLong details follow…',
      docUrl: 'https://oauthlint.dev/rules/jwt-alg-none',
    };
    reporter.reportResult(baseResult([finding]));
    const text = out.toString();
    expect(text).toContain('auth.jwt.alg-none');
    expect(text).toContain('AUTH-JWT-001');
    expect(text).toContain('src/auth/jwt.ts:14');
    expect(text).toContain('https://oauthlint.dev/rules/jwt-alg-none');
    expect(text).toContain('1 high');
  });

  it('sorts findings most-severe first', () => {
    const out = new StringStream();
    const reporter = new Reporter({ stream: out as unknown as NodeJS.WritableStream });
    const make = (sev: Finding['severity']): Finding => ({
      ruleId: `auth.test.${sev.toLowerCase()}`,
      severity: sev,
      filePath: 'a.ts',
      startLine: 1,
      endLine: 1,
      message: 'msg long enough to satisfy assertions about message presence',
    });
    reporter.reportResult(
      baseResult([make('LOW'), make('CRITICAL'), make('HIGH'), make('MEDIUM')]),
    );
    const text = out.toString();
    const critIdx = text.indexOf('auth.test.critical');
    const highIdx = text.indexOf('auth.test.high');
    const medIdx = text.indexOf('auth.test.medium');
    const lowIdx = text.indexOf('auth.test.low');
    expect(critIdx).toBeLessThan(highIdx);
    expect(highIdx).toBeLessThan(medIdx);
    expect(medIdx).toBeLessThan(lowIdx);
  });
});

describe('Reporter (code frame)', () => {
  let dir: string;
  let file: string;
  const SOURCE = [
    'function verify(token) {', // 1
    '  const opts = {', // 2
    "    algorithms: ['none'],", // 3
    '  };', // 4
    '  return jwt.verify(token, secret, opts);', // 5
    '}', // 6
    '', // trailing newline
  ].join('\n');

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'oauthlint-frame-'));
    file = join(dir, 'jwt.ts');
    writeFileSync(file, SOURCE, 'utf8');
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const frameFinding = (overrides: Partial<Finding> = {}): Finding => ({
    ruleId: 'auth.jwt.alg-none',
    severity: 'HIGH',
    filePath: file,
    startLine: 3,
    endLine: 3,
    startCol: 5,
    endCol: 24,
    message: 'JWT alg: none accepted.',
    ...overrides,
  });

  it('renders context lines, a right-aligned gutter, and a caret at the column', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      stream: out as unknown as NodeJS.WritableStream,
      color: false,
    });
    reporter.reportResult(baseResult([frameFinding()]));
    const text = stripAnsi(out.toString());

    // Two lines of context above and below the offending line are present.
    expect(text).toContain('const opts = {');
    expect(text).toContain("algorithms: ['none'],");
    expect(text).toContain('return jwt.verify(token, secret, opts);');
    // Gutter shows the surrounding line numbers.
    expect(text).toContain('1');
    expect(text).toContain('5');

    // The caret sits under the matched span on its own line: startCol is 5, so
    // four leading spaces after the gutter chrome precede the carets.
    const caretRow = text.split('\n').find((l) => l.includes('^'));
    expect(caretRow).toBeDefined();
    const caretCount = (caretRow?.match(/\^/g) ?? []).length;
    // endCol (24) is exclusive of startCol (5) → 19 carets.
    expect(caretCount).toBe(19);
    // Caret begins at the matched column: gutter chrome then 4 spaces then `^`.
    expect(caretRow).toMatch(/│ {5}\^{19}$/);
  });

  it('degrades gracefully when the file cannot be read (keeps the file:line)', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      stream: out as unknown as NodeJS.WritableStream,
      color: false,
    });
    reporter.reportResult(baseResult([frameFinding({ filePath: join(dir, 'does-not-exist.ts') })]));
    const text = stripAnsi(out.toString());
    expect(text).toContain('does-not-exist.ts:3');
    expect(text).not.toContain('^');
  });

  it('skips the frame when column info is missing', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      stream: out as unknown as NodeJS.WritableStream,
      color: false,
    });
    reporter.reportResult(baseResult([frameFinding({ startCol: undefined, endCol: undefined })]));
    const text = stripAnsi(out.toString());
    expect(text).toContain('jwt.ts:3');
    expect(text).not.toContain('^');
    // No source line should be echoed without a span to point at.
    expect(text).not.toContain("algorithms: ['none'],");
  });

  it('omits the frame entirely when codeFrame is disabled', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      stream: out as unknown as NodeJS.WritableStream,
      color: false,
      codeFrame: false,
    });
    reporter.reportResult(baseResult([frameFinding()]));
    const text = stripAnsi(out.toString());
    expect(text).toContain('auth.jwt.alg-none');
    expect(text).toContain('jwt.ts:3');
    expect(text).not.toContain('^');
    expect(text).not.toContain("algorithms: ['none'],");
  });

  it('emits no ANSI escapes when color is disabled', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      stream: out as unknown as NodeJS.WritableStream,
      color: false,
    });
    reporter.reportResult(baseResult([frameFinding()]));
    expect(out.toString()).not.toContain(ESC);
  });

  it('colors the caret with the severity accent when color is enabled', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      stream: out as unknown as NodeJS.WritableStream,
      color: true,
    });
    reporter.reportResult(baseResult([frameFinding()]));
    const raw = out.toString();
    // HIGH → red accent (31) wrapping the caret run.
    expect(raw).toContain(`${ESC}[31m^^^^^^^^^^^^^^^^^^^`);
    // Stripping ANSI still leaves the caret intact.
    expect(stripAnsi(raw)).toContain('^^^^^^^^^^^^^^^^^^^');
  });
});

describe('Reporter (JSON)', () => {
  it('emits a stable JSON shape', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      json: true,
      stream: out as unknown as NodeJS.WritableStream,
    });
    const finding: Finding = {
      ruleId: 'auth.jwt.alg-none',
      oauthlintRuleId: 'AUTH-JWT-001',
      severity: 'HIGH',
      filePath: 'src/auth/jwt.ts',
      startLine: 14,
      endLine: 16,
      message: 'JWT alg: none accepted with a sufficiently long message body.',
    };
    reporter.reportResult(baseResult([finding]));
    const payload = JSON.parse(out.toString()) as Record<string, unknown>;
    expect(payload.schemaVersion).toBe('oauthlint-v1');
    expect(payload.scannedFiles).toBe(12);
    const findings = payload.findings as Array<{ ruleId: string; severity: string }>;
    expect(findings).toHaveLength(1);
    expect(findings[0]?.ruleId).toBe('auth.jwt.alg-none');
    expect(findings[0]?.severity).toBe('HIGH');
  });

  it('includes a finding `fix` when present, and omits the key when absent', () => {
    const out = new StringStream();
    const reporter = new Reporter({
      json: true,
      stream: out as unknown as NodeJS.WritableStream,
    });
    const withFix: Finding = {
      ruleId: 'auth.go.tls.insecure-skip-verify',
      severity: 'HIGH',
      filePath: 'tls.go',
      startLine: 3,
      endLine: 3,
      message: 'InsecureSkipVerify disables certificate validation.',
      fix: {
        replacement: 'false',
        range: {
          startLine: 3,
          startCol: 22,
          endLine: 3,
          endCol: 26,
          startOffset: 40,
          endOffset: 44,
        },
      },
    };
    const noFix: Finding = {
      ruleId: 'auth.jwt.alg-none',
      severity: 'HIGH',
      filePath: 'jwt.ts',
      startLine: 1,
      endLine: 1,
      message: 'JWT alg:none accepted.',
    };
    reporter.reportResult(baseResult([withFix, noFix]));
    const payload = JSON.parse(out.toString()) as {
      findings: Array<Record<string, unknown>>;
    };
    expect(payload.findings[0]?.fix).toEqual({
      replacement: 'false',
      range: { startLine: 3, startCol: 22, endLine: 3, endCol: 26, startOffset: 40, endOffset: 44 },
    });
    // A finding without a fix must not carry the key at all (JSON.stringify
    // drops `undefined`), so existing consumers see byte-identical output.
    expect(payload.findings[1]).not.toHaveProperty('fix');
  });
});
