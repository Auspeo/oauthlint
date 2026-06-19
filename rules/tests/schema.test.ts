import { describe, expect, it } from 'vitest';
import { RuleFileSchema, RuleSchema } from '../src/schema.js';

const validRule = {
  id: 'auth.jwt.alg-none',
  languages: ['javascript', 'typescript'],
  severity: 'ERROR',
  message: 'A message long enough to satisfy the minimum-length constraint.',
  'pattern-either': [{ pattern: 'jwt.verify(...)' }],
  metadata: {
    'oauthlint-rule-id': 'AUTH-JWT-001',
    'oauthlint-doc-url': 'https://oauthlint.dev/rules/jwt-alg-none',
    category: 'security',
    cwe: 'CWE-327',
    'llm-prevalence': 'HIGH',
  },
};

describe('RuleSchema', () => {
  it('accepts a well-formed rule', () => {
    expect(RuleSchema.parse(validRule).id).toBe('auth.jwt.alg-none');
  });

  it('rejects an id that does not start with auth.', () => {
    const r = { ...validRule, id: 'jwt.alg-none' };
    expect(() => RuleSchema.parse(r)).toThrow(/auth\.<category>/);
  });

  it('rejects an id with uppercase letters', () => {
    const r = { ...validRule, id: 'auth.JWT.algNone' };
    expect(() => RuleSchema.parse(r)).toThrow();
  });

  it('rejects an oauthlint-rule-id that does not match the AUTH-CAT-NNN pattern', () => {
    const r = {
      ...validRule,
      metadata: { ...validRule.metadata, 'oauthlint-rule-id': 'AUTH-jwt-1' },
    };
    expect(() => RuleSchema.parse(r)).toThrow();
  });

  it('rejects a rule with no pattern at all', () => {
    const { 'pattern-either': _omitted, ...rest } = validRule;
    expect(() => RuleSchema.parse(rest)).toThrow(/pattern/);
  });

  it('rejects a message shorter than 20 characters', () => {
    const r = { ...validRule, message: 'too short' };
    expect(() => RuleSchema.parse(r)).toThrow();
  });

  it('rejects unknown severity values', () => {
    const r = { ...validRule, severity: 'CATASTROPHIC' };
    expect(() => RuleSchema.parse(r)).toThrow();
  });

  it('requires llm-prevalence metadata (it is our differentiator)', () => {
    const { 'llm-prevalence': _omitted, ...metaWithoutLlm } = validRule.metadata;
    const r = { ...validRule, metadata: metaWithoutLlm };
    expect(() => RuleSchema.parse(r)).toThrow();
  });
});

describe('RuleFileSchema', () => {
  it('accepts a file with at least one rule', () => {
    expect(RuleFileSchema.parse({ rules: [validRule] }).rules).toHaveLength(1);
  });

  it('rejects an empty rules array', () => {
    expect(() => RuleFileSchema.parse({ rules: [] })).toThrow();
  });
});
