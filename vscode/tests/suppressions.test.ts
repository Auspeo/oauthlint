import { describe, expect, it } from 'vitest';
import {
  buildDisableFileDirective,
  buildDisableNextLineDirective,
  leadingIndent,
} from '../src/suppressions.js';

describe('buildDisableNextLineDirective', () => {
  it('produces a bare directive without a reason', () => {
    expect(buildDisableNextLineDirective({ ruleId: 'auth.jwt.alg-none' })).toBe(
      '// oauthlint-disable-next-line auth.jwt.alg-none',
    );
  });

  it('appends an optional reason after `--`', () => {
    expect(
      buildDisableNextLineDirective({
        ruleId: 'auth.jwt.alg-none',
        reason: 'migrating in Q2',
      }),
    ).toBe('// oauthlint-disable-next-line auth.jwt.alg-none -- migrating in Q2');
  });

  it('preserves source indentation', () => {
    expect(
      buildDisableNextLineDirective({
        ruleId: 'auth.cookie.no-secure',
        indent: '  ',
      }),
    ).toBe('  // oauthlint-disable-next-line auth.cookie.no-secure');
  });

  it('switches to a block comment when requested', () => {
    expect(
      buildDisableNextLineDirective({
        ruleId: 'auth.jwt.alg-none',
        block: true,
      }),
    ).toBe('/* oauthlint-disable-next-line auth.jwt.alg-none */');
  });
});

describe('buildDisableFileDirective', () => {
  it('emits a file-wide directive', () => {
    expect(buildDisableFileDirective({ ruleId: 'auth.cookie.no-samesite' })).toBe(
      '// oauthlint-disable-file auth.cookie.no-samesite',
    );
  });
});

describe('leadingIndent', () => {
  it('returns leading spaces verbatim', () => {
    expect(leadingIndent('    const x = 1;')).toBe('    ');
  });
  it('returns tabs verbatim', () => {
    expect(leadingIndent('\t\tconst x = 1;')).toBe('\t\t');
  });
  it('returns empty string when there is no indent', () => {
    expect(leadingIndent('const x = 1;')).toBe('');
  });
});
