import { describe, expect, it } from 'vitest';
import {
  SemgrepAdapter,
  SemgrepNotInstalledError,
  normaliseRuleId,
} from '../src/adapters/semgrep.js';

describe('SemgrepAdapter', () => {
  it('throws SemgrepNotInstalledError when the binary is missing', async () => {
    const adapter = new SemgrepAdapter({
      binary: '/definitely/not/a/real/binary/semgrep-xyz',
      configPath: '/tmp',
    });
    await expect(adapter.scan('/tmp')).rejects.toBeInstanceOf(SemgrepNotInstalledError);
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

  it('leaves already-clean ids untouched', () => {
    expect(normaliseRuleId('auth.jwt.alg-none')).toBe('auth.jwt.alg-none');
  });

  it('keeps non-OAuthLint rule ids unchanged (custom rule packs)', () => {
    expect(normaliseRuleId('user.rules.custom-thing')).toBe('user.rules.custom-thing');
  });
});
