import { describe, expect, it } from 'vitest';
import { Reporter } from '../src/core/reporter.js';
import type { Finding, ScanResult } from '../src/types.js';

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
});
