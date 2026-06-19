import { execa } from 'execa';
import { describe, expect, it } from 'vitest';

/**
 * End-to-end test: invokes the actual bin/oauthlint.js binary and asserts
 * that scanning the deliberately-vulnerable example app surfaces every
 * Wave-1 rule.
 *
 * This test requires Semgrep to be installed. When Semgrep is missing
 * (e.g. clean dev laptop), the test is skipped — but in CI it MUST run.
 */

async function semgrepAvailable(): Promise<boolean> {
  try {
    const { exitCode } = await execa('semgrep', ['--version'], { reject: false });
    return exitCode === 0;
  } catch {
    return false;
  }
}

const hasSemgrep = await semgrepAvailable();
const maybe = hasSemgrep ? describe : describe.skip;

maybe('end-to-end CLI scan against vibe-app-express', () => {
  const cliBin = new URL('../bin/oauthlint.js', import.meta.url).pathname;
  // products/oauthlint/cli/tests/ → products/oauthlint/examples/vibe-app-express
  const target = new URL('../../examples/vibe-app-express', import.meta.url).pathname;

  it('finds at least 6 distinct rules including the canonical demo bugs', async () => {
    const { stdout, exitCode } = await execa('node', [cliBin, 'scan', target, '--json'], {
      reject: false,
    });
    expect([0, 1, 2]).toContain(exitCode);
    const payload = JSON.parse(stdout) as { findings: Array<{ ruleId: string }> };
    const rules = new Set(payload.findings.map((f) => f.ruleId));
    expect(rules.size).toBeGreaterThanOrEqual(6);
    // These are the unambiguous, high-signal demo bugs that should always
    // fire on the example app. If one of these regresses, the rule pack
    // has a real problem.
    expect(rules.has('auth.jwt.alg-none')).toBe(true);
    expect(rules.has('auth.oauth.hardcoded-secret')).toBe(true);
    expect(rules.has('auth.oauth.wildcard-redirect')).toBe(true);
  }, 60_000);

  it('exits non-zero when the example app contains HIGH+ findings', async () => {
    const { exitCode } = await execa('node', [cliBin, 'scan', target], { reject: false });
    expect(exitCode).toBeGreaterThanOrEqual(1);
  }, 60_000);
});
