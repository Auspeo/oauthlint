import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type OAuthLintFinding, filterBySeverity, runOAuthLint } from '../src/runner.js';

/**
 * The runner now drives the OAuthLint engine in-process; the only external
 * dependency is the Semgrep binary the engine shells out to. We exercise it
 * end-to-end by pointing `semgrepPath` at a tiny shell script we generate per
 * test that impersonates Semgrep: it prints a `semgrep --json`-shaped payload,
 * exits with a chosen code, sleeps, or floods stdout. No real Semgrep needed.
 */

let tmp: string;
beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'oauthlint-vscode-'));
});
afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

async function fakeSemgrep(body: string): Promise<string> {
  const file = join(tmp, 'fake-semgrep.sh');
  await writeFile(file, `#!/usr/bin/env bash\n${body}\n`, 'utf8');
  await chmod(file, 0o755);
  return file;
}

/** A minimal `semgrep --json` result object with the fields the adapter reads. */
function semgrepJson(results: unknown[], version = '1.157.0'): string {
  return JSON.stringify({
    version,
    results,
    errors: [],
    paths: { scanned: ['a.ts', 'b.ts'] },
  });
}

describe('runOAuthLint', () => {
  it('maps a Semgrep report into the OAuthLint report shape', async () => {
    const payload = semgrepJson([
      {
        check_id: 'auth.jwt.alg-none',
        path: 'src/jwt.ts',
        start: { line: 3, col: 1, offset: 40 },
        end: { line: 3, col: 20, offset: 59 },
        extra: {
          severity: 'ERROR',
          message: 'JWT alg:none accepted.',
          fix: 'verify(token, secret)',
          metadata: {
            'oauthlint-rule-id': 'AUTH-JWT-001',
            'oauthlint-doc-url': 'https://oauthlint.dev/rules/jwt/alg-none',
            cwe: 'CWE-347',
            'llm-prevalence': 'HIGH',
          },
        },
      },
    ]);
    const semgrep = await fakeSemgrep(`echo '${payload}'; exit 1`);
    const result = await runOAuthLint({ target: tmp, semgrepPath: semgrep, rulesDir: tmp });

    expect(result.semgrepMissing).toBe(false);
    expect(result.report?.schemaVersion).toBe('oauthlint-v1');
    expect(result.report?.scannedFiles).toBe(2);
    expect(result.report?.semgrepVersion).toBe('1.157.0');
    expect(result.report?.findings).toHaveLength(1);

    const finding = result.report?.findings[0] as OAuthLintFinding;
    expect(finding.ruleId).toBe('auth.jwt.alg-none');
    expect(finding.severity).toBe('HIGH');
    expect(finding.oauthlintRuleId).toBe('AUTH-JWT-001');
    expect(finding.docUrl).toBe('https://oauthlint.dev/rules/jwt/alg-none');
    expect(finding.cwe).toBe('CWE-347');
    expect(finding.fix?.replacement).toBe('verify(token, secret)');
    expect(finding.fix?.range.startLine).toBe(3);
    expect(finding.fix?.range.endOffset).toBe(59);
  });

  it('returns an empty report when Semgrep finds nothing', async () => {
    const semgrep = await fakeSemgrep(`echo '${semgrepJson([])}'; exit 0`);
    const result = await runOAuthLint({ target: tmp, semgrepPath: semgrep, rulesDir: tmp });
    expect(result.report?.findings).toHaveLength(0);
    expect(result.exitCode).toBe(0);
    expect(result.semgrepMissing).toBe(false);
  });

  it('flags semgrepMissing when the binary cannot be found', async () => {
    const result = await runOAuthLint({
      target: tmp,
      semgrepPath: '/definitely/not/a/real/binary/semgrep-xyz',
      rulesDir: tmp,
    });
    expect(result.semgrepMissing).toBe(true);
    expect(result.report).toBeNull();
    expect(result.exitCode).toBeNull();
  });

  it('aborts after the timeout and reports `timedOut: true`', async () => {
    const semgrep = await fakeSemgrep('sleep 5; echo "{}"');
    const result = await runOAuthLint({
      target: tmp,
      semgrepPath: semgrep,
      rulesDir: tmp,
      timeoutMs: 200,
    });
    expect(result.timedOut).toBe(true);
    expect(result.report).toBeNull();
    expect(result.semgrepMissing).toBe(false);
  }, 10_000);

  it('surfaces engine errors without throwing', async () => {
    // Non-JSON stdout makes the adapter raise a parse error; the runner must
    // still resolve with a failed result rather than throw.
    const semgrep = await fakeSemgrep('echo "not json at all"; exit 0');
    const result = await runOAuthLint({ target: tmp, semgrepPath: semgrep, rulesDir: tmp });
    expect(result.report).toBeNull();
    expect(result.exitCode).toBe(1);
    expect(result.semgrepMissing).toBe(false);
  });
});

describe('filterBySeverity', () => {
  const finding = (severity: OAuthLintFinding['severity']): OAuthLintFinding => ({
    ruleId: 'auth.jwt.alg-none',
    severity,
    filePath: 'src/jwt.ts',
    startLine: 1,
    endLine: 1,
    message: 'JWT alg:none accepted.',
  });

  it('keeps only findings at or above the minimum', () => {
    const out = filterBySeverity(
      [finding('INFO'), finding('LOW'), finding('MEDIUM'), finding('HIGH'), finding('CRITICAL')],
      'HIGH',
    );
    expect(out.map((f) => f.severity)).toEqual(['HIGH', 'CRITICAL']);
  });

  it('returns the input unchanged when the floor is INFO', () => {
    const all = [finding('INFO'), finding('HIGH')];
    expect(filterBySeverity(all, 'INFO')).toHaveLength(2);
  });
});
