import { describe, expect, it } from 'vitest';
import { buildApplyFixEdit } from '../src/fix.js';
import type { OAuthLintFinding } from '../src/runner.js';

const finding = (overrides: Partial<OAuthLintFinding> = {}): OAuthLintFinding => ({
  ruleId: 'auth.go.tls.insecure-skip-verify',
  severity: 'HIGH',
  filePath: 'tls.go',
  startLine: 3,
  endLine: 3,
  message: 'InsecureSkipVerify disables certificate validation.',
  ...overrides,
});

describe('buildApplyFixEdit', () => {
  it('converts the CLI 1-based span to a 0-based VS Code edit', () => {
    const edit = buildApplyFixEdit(
      finding({
        fix: {
          replacement: 'false',
          range: { startLine: 3, startCol: 22, endLine: 3, endCol: 27 },
        },
      }),
    );
    expect(edit).toEqual({
      // 1-based → 0-based: line 3 → 2, col 22 → 21, col 27 (exclusive) → 26.
      startLine: 2,
      startCharacter: 21,
      endLine: 2,
      endCharacter: 26,
      replacement: 'false',
      title: 'Apply OAuthLint fix for auth.go.tls.insecure-skip-verify',
    });
  });

  it('returns undefined for a finding without a fix', () => {
    expect(buildApplyFixEdit(finding())).toBeUndefined();
  });

  it('clamps line/column at zero so a degenerate 1-based span never goes negative', () => {
    const edit = buildApplyFixEdit(
      finding({
        fix: {
          replacement: 'x',
          range: { startLine: 1, startCol: 1, endLine: 1, endCol: 1 },
        },
      }),
    );
    expect(edit).toMatchObject({
      startLine: 0,
      startCharacter: 0,
      endLine: 0,
      endCharacter: 0,
    });
  });
});
