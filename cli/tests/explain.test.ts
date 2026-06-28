import { describe, expect, it } from 'vitest';
import { runExplain } from '../src/commands/explain.js';
import { Reporter } from '../src/core/reporter.js';
import type { Finding } from '../src/types.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

// `auth.jwt.alg-none` is a stable, always-shipped rule: CWE-327, OWASP
// API2:2023, llm-prevalence HIGH, with vulnerable.ts / safe.ts fixtures.
describe('runExplain — resolution', () => {
  it('resolves by rule id and prints the why + CWE/OWASP + examples', async () => {
    const out = new FakeStream();
    const code = await runExplain({
      rule: 'auth.jwt.alg-none',
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    // Title + ids
    expect(out.buf).toContain('auth.jwt.alg-none');
    expect(out.buf).toContain('AUTH-JWT-001');
    // CWE + OWASP with canonical URLs
    expect(out.buf).toContain('CWE-327');
    expect(out.buf).toContain('https://cwe.mitre.org/data/definitions/327.html');
    expect(out.buf).toContain('API2:2023');
    expect(out.buf).toContain(
      'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    );
    // llm-prevalence
    expect(out.buf).toContain('LLM-prevalence');
    expect(out.buf).toContain('HIGH');
    // why + how to fix (drawn from the rule message)
    expect(out.buf).toContain('Why this matters');
    expect(out.buf).toContain('none');
    // vulnerable + safe examples (read from fixtures)
    expect(out.buf).toContain('Vulnerable');
    expect(out.buf).toContain('jwt.verify');
    expect(out.buf).toContain('Safe');
    expect(out.buf).toContain('RS256');
    // docUrl
    expect(out.buf).toContain('https://oauthlint.dev/rules/jwt-alg-none');
  });

  it('resolves by slug', async () => {
    const out = new FakeStream();
    const code = await runExplain({
      rule: 'jwt-alg-none',
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(out.buf).toContain('auth.jwt.alg-none');
    expect(out.buf).toContain('AUTH-JWT-001');
  });

  it('resolves by oauthlint-rule-id, case-insensitively', async () => {
    const out = new FakeStream();
    const code = await runExplain({
      rule: 'auth-jwt-001',
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(out.buf).toContain('auth.jwt.alg-none');
  });
});

describe('runExplain — --json', () => {
  it('emits the structured rule object', async () => {
    const out = new FakeStream();
    const code = await runExplain({
      rule: 'AUTH-JWT-001',
      json: true,
      stream: out as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    const obj = JSON.parse(out.buf) as Record<string, unknown>;
    expect(obj.id).toBe('auth.jwt.alg-none');
    expect(obj.oauthlintRuleId).toBe('AUTH-JWT-001');
    expect(obj.slug).toBe('jwt-alg-none');
    expect(obj.cwe).toBe('CWE-327');
    expect(obj.cweUrl).toBe('https://cwe.mitre.org/data/definitions/327.html');
    expect(obj.owasp).toBe('API2:2023');
    expect(obj.owaspUrl).toBe(
      'https://owasp.org/API-Security/editions/2023/en/0xa2-broken-authentication/',
    );
    expect(obj.llmPrevalence).toBe('HIGH');
    expect(obj.docUrl).toBe('https://oauthlint.dev/rules/jwt-alg-none');
    expect(typeof obj.message).toBe('string');
    expect((obj.message as string).length).toBeGreaterThan(20);
    const examples = obj.examples as {
      vulnerable: { code: string } | null;
      safe: { code: string } | null;
    };
    expect(examples.vulnerable?.code).toContain('jwt.verify');
    expect(examples.safe?.code).toContain('RS256');
    // Annotation comments are stripped from the examples.
    expect(examples.vulnerable?.code).not.toContain('ruleid:');
    expect(examples.safe?.code).not.toContain('ok:');
  });
});

describe('runExplain — unknown rule', () => {
  it('exits non-zero and points the user at `oauthlint list`', async () => {
    const out = new FakeStream();
    const err = new FakeStream();
    const code = await runExplain({
      rule: 'auth.does.not-exist',
      stream: out as unknown as NodeJS.WritableStream,
      errStream: err as unknown as NodeJS.WritableStream,
    });
    expect(code).not.toBe(0);
    expect(out.buf).toBe('');
    expect(err.buf).toContain('Unknown rule');
    expect(err.buf).toContain('oauthlint list');
  });
});

describe('scan teaching hint', () => {
  const finding: Finding = {
    ruleId: 'auth.jwt.alg-none',
    oauthlintRuleId: 'AUTH-JWT-001',
    severity: 'HIGH',
    filePath: 'src/auth/jwt.ts',
    startLine: 14,
    endLine: 14,
    message: 'JWT verified with alg none.',
    docUrl: 'https://oauthlint.dev/rules/jwt-alg-none',
  };

  it('appends an `explain` hint in pretty mode', () => {
    const out = new FakeStream();
    new Reporter({ stream: out as unknown as NodeJS.WritableStream }).reportResult({
      findings: [finding],
      scannedFiles: 1,
      durationMs: 5,
      semgrepVersion: '1.0.0',
      errors: [],
    });
    expect(out.buf).toContain('oauthlint explain auth.jwt.alg-none');
  });

  it('never leaks the hint into JSON output', () => {
    const out = new FakeStream();
    new Reporter({ json: true, stream: out as unknown as NodeJS.WritableStream }).reportResult({
      findings: [finding],
      scannedFiles: 1,
      durationMs: 5,
      semgrepVersion: '1.0.0',
      errors: [],
    });
    expect(out.buf).not.toContain('explain');
    // Output is still valid JSON.
    expect(() => JSON.parse(out.buf)).not.toThrow();
  });
});
