import { describe, expect, it } from 'vitest';
import { relativise, toSarif } from '../src/core/sarif.js';
import type { Finding, ScanResult } from '../src/types.js';

const baseResult = (findings: Finding[]): ScanResult => ({
  findings,
  scannedFiles: 1,
  durationMs: 100,
  semgrepVersion: '1.163.0',
  errors: [],
});

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  ruleId: 'auth.jwt.alg-none',
  oauthlintRuleId: 'AUTH-JWT-001',
  severity: 'HIGH',
  filePath: 'src/auth/jwt.ts',
  startLine: 14,
  endLine: 14,
  message: 'JWT alg:none accepted.\nLong details here…',
  docUrl: 'https://oauthlint.dev/rules/jwt-alg-none',
  cwe: 'CWE-327',
  llmPrevalence: 'HIGH',
  ...overrides,
});

describe('toSarif', () => {
  it('produces a SARIF v2.1.0 envelope', async () => {
    const sarif = await toSarif(baseResult([finding()]));
    expect(sarif.$schema).toMatch(/sarif-2\.1\.0/);
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
  });

  it('declares the tool driver as "OAuthLint"', async () => {
    const sarif = await toSarif(baseResult([finding()]));
    expect(sarif.runs[0]?.tool.driver.name).toBe('OAuthLint');
    expect(sarif.runs[0]?.tool.driver.informationUri).toBe('https://oauthlint.dev');
  });

  it('emits one rule definition per distinct ruleId', async () => {
    const sarif = await toSarif(
      baseResult([
        finding({ ruleId: 'auth.jwt.alg-none' }),
        finding({ ruleId: 'auth.jwt.alg-none' }),
        finding({ ruleId: 'auth.oauth.no-state' }),
      ]),
    );
    const rules = sarif.runs[0]?.tool.driver.rules ?? [];
    expect(rules.map((r) => r.id).sort()).toEqual(['auth.jwt.alg-none', 'auth.oauth.no-state']);
  });

  it('maps severities to SARIF levels (note/warning/error)', async () => {
    const sarif = await toSarif(
      baseResult([
        finding({ severity: 'INFO', ruleId: 'auth.test.info' }),
        finding({ severity: 'LOW', ruleId: 'auth.test.low' }),
        finding({ severity: 'MEDIUM', ruleId: 'auth.test.medium' }),
        finding({ severity: 'HIGH', ruleId: 'auth.test.high' }),
        finding({ severity: 'CRITICAL', ruleId: 'auth.test.critical' }),
      ]),
    );
    const results = sarif.runs[0]?.results ?? [];
    const byId = new Map(results.map((r) => [r.ruleId, r.level] as const));
    expect(byId.get('auth.test.info')).toBe('note');
    expect(byId.get('auth.test.low')).toBe('note');
    expect(byId.get('auth.test.medium')).toBe('warning');
    expect(byId.get('auth.test.high')).toBe('error');
    expect(byId.get('auth.test.critical')).toBe('error');
  });

  it('tags rules with CWE + llm-prevalence + security_severity for GitHub Security tab', async () => {
    const sarif = await toSarif(baseResult([finding()]));
    const rule = sarif.runs[0]?.tool.driver.rules[0];
    expect(rule?.properties.tags).toEqual(
      expect.arrayContaining([
        'security',
        'oauthlint',
        'external/cwe/cwe-327',
        'llm-prevalence/high',
      ]),
    );
    expect(rule?.properties.security_severity).toBe('7.5');
  });

  it('locates findings precisely (file:line)', async () => {
    const sarif = await toSarif(baseResult([finding({ startLine: 12, endLine: 14 })]));
    const loc = sarif.runs[0]?.results[0]?.locations[0]?.physicalLocation;
    expect(loc?.region.startLine).toBe(12);
    expect(loc?.region.endLine).toBe(14);
  });
});

describe('relativise', () => {
  const base = '/repo/root';

  it('makes an absolute path under base relative to it', () => {
    expect(relativise('/repo/root/src/auth/jwt.ts', base)).toBe('src/auth/jwt.ts');
  });

  it('handles base without trailing slash and nested dirs', () => {
    expect(relativise('/repo/root/a/b/c.ts', base)).toBe('a/b/c.ts');
  });

  it('passes already-relative paths through unchanged', () => {
    expect(relativise('src/auth/jwt.ts', base)).toBe('src/auth/jwt.ts');
  });

  it('strips a leading ./', () => {
    expect(relativise('./src/auth/jwt.ts', base)).toBe('src/auth/jwt.ts');
  });

  it('keeps an absolute path that resolves outside base (no misleading ..)', () => {
    expect(relativise('/elsewhere/file.ts', base)).toBe('/elsewhere/file.ts');
  });

  it('normalises Windows separators to forward slashes', () => {
    expect(relativise('src\\auth\\jwt.ts', base)).toBe('src/auth/jwt.ts');
  });
});
