import { describe, expect, it } from 'vitest';
import { type FindingHoverData, buildFindingHoverMarkdown } from '../src/hover.js';

const base: FindingHoverData = {
  ruleId: 'auth.jwt.alg-none',
  oauthlintRuleId: 'OL-JWT-001',
  severity: 'HIGH',
  message: 'JWT verified with `alg: none`. Pin an explicit algorithm allowlist.',
  docUrl: 'https://oauthlint.dev/rules/jwt/alg-none',
};

describe('buildFindingHoverMarkdown', () => {
  it('includes both rule ids, the severity and the full message', () => {
    const md = buildFindingHoverMarkdown(base);
    expect(md).toContain('OAuthLint');
    expect(md).toContain('`OL-JWT-001`');
    expect(md).toContain('`auth.jwt.alg-none`');
    expect(md).toContain('**Severity:** HIGH');
    expect(md).toContain('Pin an explicit algorithm allowlist.');
  });

  it('renders a "View documentation" link to the doc url', () => {
    const md = buildFindingHoverMarkdown(base);
    expect(md).toContain('[View documentation](https://oauthlint.dev/rules/jwt/alg-none)');
  });

  it('renders CWE and OWASP references when present', () => {
    const md = buildFindingHoverMarkdown({ ...base, cwe: 'CWE-347', owasp: 'A02:2021' });
    expect(md).toContain('**CWE:** CWE-347');
    expect(md).toContain('**OWASP:** A02:2021');
  });

  it('omits CWE/OWASP/doc sections when those fields are missing', () => {
    const md = buildFindingHoverMarkdown({
      ruleId: 'auth.cookie.no-secure',
      severity: 'MEDIUM',
      message: 'Session cookie set without the Secure flag.',
    });
    expect(md).toContain('`auth.cookie.no-secure`');
    expect(md).toContain('Session cookie set without the Secure flag.');
    expect(md).not.toContain('CWE');
    expect(md).not.toContain('OWASP');
    expect(md).not.toContain('View documentation');
  });

  it('shows the single rule id when oauthlintRuleId is absent or identical', () => {
    const absent = buildFindingHoverMarkdown({ ...base, oauthlintRuleId: undefined });
    expect(absent).toContain('`auth.jwt.alg-none`');
    expect(absent).not.toContain('(`auth.jwt.alg-none`)');

    const identical = buildFindingHoverMarkdown({
      ...base,
      oauthlintRuleId: 'auth.jwt.alg-none',
    });
    expect(identical).not.toContain('(`auth.jwt.alg-none`)');
  });

  it('ignores a blank doc url rather than emitting an empty link', () => {
    const md = buildFindingHoverMarkdown({ ...base, docUrl: '   ' });
    expect(md).not.toContain('View documentation');
  });
});
