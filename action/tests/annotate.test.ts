import { describe, expect, it } from 'vitest';
// The helper is plain ESM JS; import its pure, exported functions directly.
import {
  buildSummary,
  escapeData,
  escapeMarkdownCell,
  escapeProperty,
  formatAnnotation,
  formatAnnotations,
  normalizePath,
  readFindings,
  ruleDocUrl,
  severityToCommand,
} from '../annotate.mjs';

describe('severityToCommand', () => {
  it('maps HIGH and CRITICAL to error', () => {
    expect(severityToCommand('HIGH')).toBe('error');
    expect(severityToCommand('CRITICAL')).toBe('error');
  });

  it('maps MEDIUM and below to warning', () => {
    expect(severityToCommand('MEDIUM')).toBe('warning');
    expect(severityToCommand('LOW')).toBe('warning');
    expect(severityToCommand('INFO')).toBe('warning');
  });

  it('is case-insensitive', () => {
    expect(severityToCommand('high')).toBe('error');
    expect(severityToCommand('medium')).toBe('warning');
  });
});

describe('normalizePath', () => {
  it('strips the workspace prefix so paths anchor to the diff', () => {
    expect(normalizePath('/github/workspace/src/auth.ts', '/github/workspace')).toBe('src/auth.ts');
  });

  it('handles a workspace that already has a trailing slash', () => {
    expect(normalizePath('/gh/ws/a.ts', '/gh/ws/')).toBe('a.ts');
  });

  it('strips a leading ./', () => {
    expect(normalizePath('./src/auth.ts', '')).toBe('src/auth.ts');
  });

  it('strips a leading absolute slash when no workspace match', () => {
    expect(normalizePath('/already/relative.ts', '/github/workspace')).toBe('already/relative.ts');
  });

  it('leaves an already-relative path alone', () => {
    expect(normalizePath('src/auth.ts', '/github/workspace')).toBe('src/auth.ts');
  });
});

describe('escapeData / escapeProperty', () => {
  it('escapes %, CR and LF in message data', () => {
    expect(escapeData('a\nb')).toBe('a%0Ab');
    expect(escapeData('100%')).toBe('100%25');
    expect(escapeData('a\r\nb')).toBe('a%0D%0Ab');
  });

  it('additionally escapes : and , in property values', () => {
    expect(escapeProperty('a:b,c')).toBe('a%3Ab%2Cc');
  });
});

describe('formatAnnotation', () => {
  const base = {
    ruleId: 'auth.jwt.alg-none',
    oauthlintRuleId: 'AUTH-JWT-001',
    severity: 'HIGH',
    filePath: '/github/workspace/src/auth.ts',
    startLine: 12,
    endLine: 12,
    message: 'JWT alg "none" disables signature verification',
  };

  it('produces an ::error line for HIGH with repo-relative path, line and title', () => {
    expect(formatAnnotation(base, '/github/workspace')).toBe(
      '::error file=src/auth.ts,line=12,title=AUTH-JWT-001::JWT alg "none" disables signature verification',
    );
  });

  it('produces an ::warning line for MEDIUM', () => {
    const f = { ...base, severity: 'MEDIUM' };
    expect(formatAnnotation(f, '/github/workspace')).toMatch(/^::warning /);
  });

  it('falls back to ruleId for the title when oauthlintRuleId is absent', () => {
    const f = { ...base, oauthlintRuleId: undefined };
    expect(formatAnnotation(f, '/github/workspace')).toContain('title=auth.jwt.alg-none');
  });

  it('escapes newlines in the message so the command stays single-line', () => {
    const f = { ...base, message: 'line one\nline two' };
    const out = formatAnnotation(f, '/github/workspace');
    expect(out).toContain('::line one%0Aline two');
    expect(out?.split('\n')).toHaveLength(1);
  });

  it('emits col only when present', () => {
    expect(formatAnnotation(base, '/github/workspace')).not.toContain('col=');
    const withCol = { ...base, startColumn: 5 };
    expect(formatAnnotation(withCol, '/github/workspace')).toContain('col=5');
  });

  it('omits the line property when startLine is missing', () => {
    const f = { ...base, startLine: undefined };
    expect(formatAnnotation(f, '/github/workspace')).not.toContain('line=');
  });

  it('returns null when there is no usable file path', () => {
    const f = { ...base, filePath: '' };
    expect(formatAnnotation(f, '/github/workspace')).toBeNull();
  });
});

describe('formatAnnotations', () => {
  it('skips findings without a path and keeps the rest', () => {
    const findings = [
      { ruleId: 'r1', severity: 'HIGH', filePath: '/ws/a.ts', startLine: 1, message: 'm1' },
      { ruleId: 'r2', severity: 'LOW', filePath: '', startLine: 2, message: 'm2' },
    ];
    const out = formatAnnotations(findings, '/ws');
    expect(out).toHaveLength(1);
    expect(out[0]).toMatch(/^::error file=a\.ts/);
  });
});

describe('ruleDocUrl', () => {
  it('prefers the CLI-provided docUrl', () => {
    expect(ruleDocUrl({ ruleId: 'auth.jwt.alg-none', docUrl: 'https://x.test/y' })).toBe(
      'https://x.test/y',
    );
  });

  it('derives the slug from the last segment of the dotted ruleId', () => {
    expect(ruleDocUrl({ ruleId: 'auth.jwt.alg-none' })).toBe(
      'https://oauthlint.dev/rules/alg-none',
    );
  });

  it('returns null when no ruleId is derivable', () => {
    expect(ruleDocUrl({})).toBeNull();
  });
});

describe('escapeMarkdownCell', () => {
  it('escapes pipes and flattens newlines', () => {
    expect(escapeMarkdownCell('a|b\nc')).toBe('a\\|b c');
  });
});

describe('buildSummary', () => {
  it('reports a clean result when there are no findings', () => {
    const md = buildSummary([], '');
    expect(md).toContain('## OAuthLint results');
    expect(md).toContain('No OAuth/OIDC/JWT findings');
  });

  it('emits a heading, a count-by-severity line, and a table', () => {
    const findings = [
      {
        ruleId: 'auth.jwt.alg-none',
        oauthlintRuleId: 'AUTH-JWT-001',
        severity: 'HIGH',
        filePath: '/ws/src/auth.ts',
        startLine: 12,
        message: 'bad alg',
      },
      {
        ruleId: 'auth.pkce.missing',
        severity: 'MEDIUM',
        filePath: '/ws/src/oauth.ts',
        startLine: 5,
        message: 'no PKCE',
      },
    ];
    const md = buildSummary(findings, '/ws');
    expect(md).toContain('## OAuthLint results');
    expect(md).toContain('Found **2** findings');
    // Highest severity listed first.
    expect(md).toMatch(/\*\*1\*\* HIGH · \*\*1\*\* MEDIUM/);
    // Table header + linked rule + repo-relative location.
    expect(md).toContain('| Severity | Rule | Location | Message |');
    expect(md).toContain('[AUTH-JWT-001](https://oauthlint.dev/rules/alg-none)');
    expect(md).toContain('`src/auth.ts:12`');
  });

  it('caps the table and adds a "+N more" note instead of silently truncating', () => {
    const findings = Array.from({ length: 7 }, (_, i) => ({
      ruleId: `r${i}`,
      severity: 'LOW',
      filePath: `/ws/f${i}.ts`,
      startLine: i + 1,
      message: `m${i}`,
    }));
    const md = buildSummary(findings, '/ws', 3);
    // 3 rendered rows.
    expect(md.match(/\| LOW \|/g) ?? []).toHaveLength(3);
    expect(md).toContain('and **4** more');
  });
});

describe('readFindings', () => {
  it('returns null for a missing report', () => {
    expect(readFindings('/no/such/file.json')).toBeNull();
  });
});
