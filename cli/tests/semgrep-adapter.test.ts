import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import {
  SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepOutputError,
  normaliseRuleId,
} from '../src/adapters/semgrep.js';

/** Write an executable fake `semgrep` that echoes the given stdout, verbatim. */
function fakeSemgrep(dir: string, stdout: string): string {
  const bin = join(dir, 'semgrep');
  // `printf %s` keeps the payload byte-exact (no trailing newline surprises).
  writeFileSync(bin, `#!/bin/sh\nprintf '%s' ${JSON.stringify(stdout)}\n`);
  chmodSync(bin, 0o755);
  return bin;
}

describe('SemgrepAdapter', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'oauthlint-semgrep-'));
  afterAll(() => rmSync(tmp, { recursive: true, force: true }));

  it('throws SemgrepNotInstalledError when the binary is missing', async () => {
    const adapter = new SemgrepAdapter({
      binary: '/definitely/not/a/real/binary/semgrep-xyz',
      configPath: '/tmp',
    });
    await expect(adapter.scan('/tmp')).rejects.toBeInstanceOf(SemgrepNotInstalledError);
  });

  it('throws SemgrepOutputError on non-empty unparseable output (no silent 0 findings)', async () => {
    const binary = fakeSemgrep(tmp, '{"results": [ truncated…');
    const adapter = new SemgrepAdapter({ binary, configPath: '/tmp' });
    await expect(adapter.scan('/tmp')).rejects.toBeInstanceOf(SemgrepOutputError);
  });

  it('treats empty output as a clean (zero-finding) scan', async () => {
    const binary = fakeSemgrep(tmp, '');
    const adapter = new SemgrepAdapter({ binary, configPath: '/tmp' });
    const result = await adapter.scan('/tmp');
    expect(result.findings).toEqual([]);
  });

  it('getVersion returns null when the binary is missing', async () => {
    const adapter = new SemgrepAdapter({
      binary: '/definitely/not/a/real/binary/semgrep-xyz',
      configPath: '/tmp',
    });
    expect(await adapter.getVersion()).toBeNull();
  });
});

describe('normaliseRuleId', () => {
  it('strips the file-path prefix Semgrep adds when loading from a directory', () => {
    expect(normaliseRuleId('packages.oauthlint-rules.rules.jwt.auth.jwt.alg-none')).toBe(
      'auth.jwt.alg-none',
    );
    expect(normaliseRuleId('rules.oauth.auth.oauth.hardcoded-secret')).toBe(
      'auth.oauth.hardcoded-secret',
    );
  });

  it('strips the prefix for language-pack ids (4 segments)', () => {
    expect(normaliseRuleId('rules.rules.py.jwt.auth.py.jwt.no-verify')).toBe(
      'auth.py.jwt.no-verify',
    );
    expect(normaliseRuleId('rules.rules.go.tls.auth.go.tls.insecure-skip-verify')).toBe(
      'auth.go.tls.insecure-skip-verify',
    );
    expect(normaliseRuleId('rules.rules.java.web.auth.java.web.csrf-disabled')).toBe(
      'auth.java.web.csrf-disabled',
    );
    expect(normaliseRuleId('rules.rules.rust.flow.auth.rust.flow.timing-unsafe-compare')).toBe(
      'auth.rust.flow.timing-unsafe-compare',
    );
  });

  it('leaves already-clean ids untouched (3 and 4 segments)', () => {
    expect(normaliseRuleId('auth.jwt.alg-none')).toBe('auth.jwt.alg-none');
    expect(normaliseRuleId('auth.py.jwt.no-verify')).toBe('auth.py.jwt.no-verify');
  });

  it('keeps non-OAuthLint rule ids unchanged (custom rule packs)', () => {
    expect(normaliseRuleId('user.rules.custom-thing')).toBe('user.rules.custom-thing');
  });
});
