import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  applySuppressions,
  isSuppressed,
  loadSuppressionMap,
  parseSuppressionsFromSource,
} from '../src/core/suppress.js';
import type { Finding } from '../src/types.js';

const finding = (ruleId: string, filePath: string, line: number): Finding => ({
  ruleId,
  severity: 'HIGH',
  filePath,
  startLine: line,
  endLine: line,
  message: 'msg long enough to satisfy assertions about message presence',
});

describe('parseSuppressionsFromSource', () => {
  it('recognises oauthlint-disable-next-line', () => {
    const src = [
      'const x = 1;',
      '// oauthlint-disable-next-line auth.jwt.alg-none',
      'const bad = true;',
    ].join('\n');
    const maps = parseSuppressionsFromSource(src);
    expect(maps.byLine.get('auth.jwt.alg-none')?.has(2)).toBe(true);
  });

  it('recognises oauthlint-disable-line (current line)', () => {
    const src = ['const bad = true; // oauthlint-disable-line auth.jwt.alg-none'].join('\n');
    const maps = parseSuppressionsFromSource(src);
    expect(maps.byLine.get('auth.jwt.alg-none')?.has(0)).toBe(true);
  });

  it('recognises oauthlint-disable-file', () => {
    const src = ['// oauthlint-disable-file auth.cookie.no-samesite', 'const x = 1;'].join('\n');
    const maps = parseSuppressionsFromSource(src);
    expect(maps.fileWide.has('auth.cookie.no-samesite')).toBe(true);
  });

  it('captures the optional reason after `--`', () => {
    const src = '// oauthlint-disable-next-line auth.jwt.alg-none -- legacy code, replaced in Q2';
    const maps = parseSuppressionsFromSource(src);
    // Just assert the directive is parsed; reasons aren't stored separately
    // for now but the regex must not refuse a reason-bearing line.
    expect(maps.byLine.get('auth.jwt.alg-none')?.has(1)).toBe(true);
  });

  it('ignores oauthlint-disable-file *  (blanket silencing is too dangerous)', () => {
    const src = '// oauthlint-disable-file *';
    const maps = parseSuppressionsFromSource(src);
    expect(maps.fileWide.has('*')).toBe(false);
  });

  it('does not match unrelated comments', () => {
    const src = [
      '// oauthlint is great',
      "// disable: 'auth.jwt.alg-none' — no, this isn't a directive",
      'const x = 1;',
    ].join('\n');
    const maps = parseSuppressionsFromSource(src);
    expect(maps.byLine.size).toBe(0);
    expect(maps.fileWide.size).toBe(0);
  });
});

describe('isSuppressed', () => {
  it('returns true when the file-wide rule id matches', () => {
    const maps = parseSuppressionsFromSource('// oauthlint-disable-file auth.jwt.alg-none');
    expect(isSuppressed(finding('auth.jwt.alg-none', 'a.ts', 42), maps)).toBe(true);
  });

  it('returns false for a different rule id', () => {
    const maps = parseSuppressionsFromSource('// oauthlint-disable-file auth.jwt.alg-none');
    expect(isSuppressed(finding('auth.oauth.no-state', 'a.ts', 42), maps)).toBe(false);
  });

  it('matches `disable-next-line` against the line directly below', () => {
    const src = ['line0', '// oauthlint-disable-next-line auth.jwt.alg-none', 'line2'].join('\n');
    const maps = parseSuppressionsFromSource(src);
    // line2 is 0-based index 2 ⇒ 1-based startLine 3
    expect(isSuppressed(finding('auth.jwt.alg-none', 'a.ts', 3), maps)).toBe(true);
  });

  it('honours wildcard rule id on `disable-next-line *`', () => {
    const src = ['// oauthlint-disable-next-line *', 'line1'].join('\n');
    const maps = parseSuppressionsFromSource(src);
    expect(isSuppressed(finding('auth.jwt.alg-none', 'a.ts', 2), maps)).toBe(true);
  });
});

describe('applySuppressions (filesystem)', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'oauthlint-suppress-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('removes findings whose lines carry an inline disable directive', async () => {
    const file = join(dir, 'bad.ts');
    await writeFile(
      file,
      [
        "import jwt from 'jsonwebtoken';",
        '// oauthlint-disable-next-line auth.jwt.alg-none -- migration in progress',
        "export const t = jwt.verify('x', 'k', { algorithms: ['RS256', 'none'] });",
      ].join('\n'),
      'utf8',
    );
    const { kept, suppressed } = await applySuppressions([
      finding('auth.jwt.alg-none', file, 3),
      finding('auth.oauth.no-state', file, 3),
    ]);
    expect(kept.map((f) => f.ruleId)).toEqual(['auth.oauth.no-state']);
    expect(suppressed.map((f) => f.ruleId)).toEqual(['auth.jwt.alg-none']);
  });
});

describe('loadSuppressionMap (missing file)', () => {
  it('returns an empty map when the file cannot be read', async () => {
    const maps = await loadSuppressionMap('/no/such/file/anywhere.ts');
    expect(maps.byLine.size).toBe(0);
    expect(maps.fileWide.size).toBe(0);
  });
});
