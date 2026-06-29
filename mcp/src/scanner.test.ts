import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { ToolError } from './errors.js';
import { MAX_CODE_CHARS, scanCode } from './scanner.js';

/**
 * Scanning shells out to Semgrep. When it is not installed (e.g. a minimal CI
 * image) the Semgrep-dependent cases are skipped, mirroring the rule pack's
 * own `hasSemgrep()` guard in rules/tests/fixes.test.ts.
 */
function hasSemgrep(): boolean {
  try {
    execFileSync('semgrep', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const semgrep = hasSemgrep();
const withSemgrep = semgrep ? it : it.skip;

// A textbook anti-pattern: trusting jwt.decode() output without verifying the
// signature. Matches rule auth.jwt.decode-without-verify.
const VULNERABLE = `import jwt from 'jsonwebtoken';
declare const token: string;
const payload = jwt.decode(token);
export { payload };
`;

// Code with no auth surface at all: no rule can match, so the scan is clean.
const SAFE = `export function add(a: number, b: number): number {
  return a + b;
}
`;

describe('scanCode', () => {
  withSemgrep('flags a vulnerable JWT snippet with the expected rule', async () => {
    const result = await scanCode({ code: VULNERABLE, language: 'typescript' });
    expect(result.findingCount).toBeGreaterThan(0);
    const ids = result.findings.map((f) => f.ruleId);
    expect(ids).toContain('auth.jwt.decode-without-verify');
    const finding = result.findings.find((f) => f.ruleId === 'auth.jwt.decode-without-verify');
    expect(finding?.severity).toBeDefined();
    expect(finding?.line).toBeGreaterThan(0);
    // scan_code must never leak the temp path it scanned.
    expect(finding?.file).toBeUndefined();
  });

  withSemgrep('returns no findings for safe code', async () => {
    const result = await scanCode({ code: SAFE, language: 'typescript' });
    expect(result.findingCount).toBe(0);
    expect(result.highestSeverity).toBeNull();
    expect(result.findings).toEqual([]);
  });

  withSemgrep('respects the minSeverity filter', async () => {
    const result = await scanCode({
      code: VULNERABLE,
      language: 'typescript',
      minSeverity: 'CRITICAL',
    });
    // The rule is below CRITICAL, so a CRITICAL floor filters it out.
    expect(result.findingCount).toBe(0);
  });

  it('rejects an oversized snippet without scanning', async () => {
    const huge = 'a'.repeat(MAX_CODE_CHARS + 1);
    await expect(scanCode({ code: huge, language: 'typescript' })).rejects.toBeInstanceOf(
      ToolError,
    );
  });
});
