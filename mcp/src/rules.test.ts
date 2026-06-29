import { describe, expect, it } from 'vitest';
import { ToolError } from './errors.js';
import { explainRule, listRules } from './rules.js';

describe('explainRule', () => {
  it('returns metadata for a known rule by id', async () => {
    const explained = await explainRule('auth.jwt.decode-without-verify');
    expect(explained.id).toBe('auth.jwt.decode-without-verify');
    expect(explained.oauthlintRuleId).toMatch(/^AUTH-/);
    expect(explained.findingSeverity).toBeDefined();
    expect(explained.cwe).toBeTruthy();
    expect(explained.message.length).toBeGreaterThan(0);
  });

  it('resolves a rule by its oauthlint-rule-id', async () => {
    const byId = await explainRule('auth.jwt.decode-without-verify');
    const bySlug = await explainRule(byId.oauthlintRuleId);
    expect(bySlug.id).toBe(byId.id);
  });

  it('throws a ToolError for an unknown rule', async () => {
    await expect(explainRule('does.not.exist')).rejects.toBeInstanceOf(ToolError);
  });
});

describe('listRules', () => {
  it('lists every shipped rule with the expected shape', async () => {
    const rules = await listRules();
    expect(rules.length).toBeGreaterThan(0);
    const sample = rules[0];
    expect(sample).toBeDefined();
    expect(sample?.id).toBeTruthy();
    expect(sample?.severity).toBeDefined();
    expect(Array.isArray(sample?.languages)).toBe(true);
  });

  it('filters by language', async () => {
    const rust = await listRules({ language: 'rust' });
    expect(rust.length).toBeGreaterThan(0);
    expect(rust.every((r) => r.languages.includes('rust'))).toBe(true);
  });

  it('filters by minimum severity', async () => {
    const all = await listRules();
    const high = await listRules({ minSeverity: 'HIGH' });
    expect(high.length).toBeLessThanOrEqual(all.length);
    expect(high.every((r) => r.severity === 'HIGH' || r.severity === 'CRITICAL')).toBe(true);
  });
});
