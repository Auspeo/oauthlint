import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { type OAuthLintFinding, filterBySeverity, runOAuthLint } from '../src/runner.js';

/**
 * The runner is wired around `spawn(...)`. We exercise it end-to-end by
 * pointing `cliPath` at a tiny shell script we generate per-test that
 * either prints a fake report or exits with a chosen code / takes too
 * long. No real Semgrep needed.
 */

let tmp: string;
beforeEach(async () => {
  tmp = await mkdtemp(join(tmpdir(), 'oauthlint-vscode-'));
});
afterEach(async () => {
  await rm(tmp, { recursive: true, force: true });
});

async function fakeCli(body: string): Promise<string> {
  const file = join(tmp, 'fake-cli.sh');
  await writeFile(file, `#!/usr/bin/env bash\n${body}\n`, 'utf8');
  await chmod(file, 0o755);
  return file;
}

const finding = (overrides: Partial<OAuthLintFinding> = {}): OAuthLintFinding => ({
  ruleId: 'auth.jwt.alg-none',
  severity: 'HIGH',
  filePath: 'src/jwt.ts',
  startLine: 1,
  endLine: 1,
  message: 'JWT alg:none accepted.',
  ...overrides,
});

describe('runOAuthLint', () => {
  it('parses a valid oauthlint JSON report', async () => {
    const report = {
      schemaVersion: 'oauthlint-v1',
      scannedFiles: 5,
      durationMs: 42,
      semgrepVersion: '1.157.0',
      errors: [],
      findings: [finding()],
    };
    const cli = await fakeCli(`echo '${JSON.stringify(report)}'; exit 0`);
    const result = await runOAuthLint({ target: tmp, cliPath: cli });
    expect(result.exitCode).toBe(0);
    expect(result.report?.scannedFiles).toBe(5);
    expect(result.report?.findings).toHaveLength(1);
  });

  it('returns a null report when stdout is empty', async () => {
    const cli = await fakeCli('exit 0');
    const result = await runOAuthLint({ target: tmp, cliPath: cli });
    expect(result.report).toBeNull();
    expect(result.exitCode).toBe(0);
  });

  it('returns null report when the schemaVersion does not match', async () => {
    const cli = await fakeCli(`echo '{"schemaVersion": "v-other", "findings": []}'`);
    const result = await runOAuthLint({ target: tmp, cliPath: cli });
    expect(result.report).toBeNull();
  });

  it('captures stderr and resolves even when the CLI fails', async () => {
    const cli = await fakeCli(`echo "boom" 1>&2; exit 7`);
    const result = await runOAuthLint({ target: tmp, cliPath: cli });
    expect(result.exitCode).toBe(7);
    expect(result.stderr).toContain('boom');
    expect(result.report).toBeNull();
  });

  it('handles a missing binary gracefully (no throw)', async () => {
    const result = await runOAuthLint({
      target: tmp,
      cliPath: '/definitely/not/a/real/binary/oauthlint-xyz',
    });
    expect(result.report).toBeNull();
    expect(result.exitCode).toBeNull();
  });

  it('aborts after the timeout and reports `timedOut: true`', async () => {
    const cli = await fakeCli('sleep 5; echo "{}"');
    const result = await runOAuthLint({
      target: tmp,
      cliPath: cli,
      timeoutMs: 200,
    });
    expect(result.timedOut).toBe(true);
  }, 10_000);
});

describe('filterBySeverity', () => {
  it('keeps only findings at or above the minimum', () => {
    const out = filterBySeverity(
      [
        finding({ severity: 'INFO' }),
        finding({ severity: 'LOW' }),
        finding({ severity: 'MEDIUM' }),
        finding({ severity: 'HIGH' }),
        finding({ severity: 'CRITICAL' }),
      ],
      'HIGH',
    );
    expect(out.map((f) => f.severity)).toEqual(['HIGH', 'CRITICAL']);
  });

  it('returns the input unchanged when the floor is INFO', () => {
    const all = [finding({ severity: 'INFO' }), finding({ severity: 'HIGH' })];
    expect(filterBySeverity(all, 'INFO')).toHaveLength(2);
  });
});
