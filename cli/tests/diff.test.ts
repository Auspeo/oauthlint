import { describe, expect, it } from 'vitest';
import { unifiedDiff } from '../src/core/diff.js';

describe('unifiedDiff', () => {
  it('returns an empty string when inputs are identical', () => {
    expect(unifiedDiff('a.ts', 'x\ny\n', 'x\ny\n')).toBe('');
  });

  it('emits standard unified headers and a single-line change', () => {
    const out = unifiedDiff(
      'server.ts',
      'const a = 1;\nrejectUnauthorized: false\nconst b = 2;\n',
      'const a = 1;\nrejectUnauthorized: true\nconst b = 2;\n',
    );
    expect(out).toContain('--- a/server.ts');
    expect(out).toContain('+++ b/server.ts');
    expect(out).toMatch(/@@ -\d+,\d+ \+\d+,\d+ @@/);
    expect(out).toContain('-rejectUnauthorized: false');
    expect(out).toContain('+rejectUnauthorized: true');
    // Unchanged neighbours are shown as context (leading space), not +/-.
    expect(out).toContain(' const a = 1;');
    expect(out).toContain(' const b = 2;');
  });

  it('does not double the slash for an absolute label', () => {
    const out = unifiedDiff('/tmp/x.ts', 'a\n', 'b\n');
    expect(out).toContain('--- a/tmp/x.ts');
    expect(out).not.toContain('a//tmp');
  });

  it('produces separate hunks for changes far apart', () => {
    const original = `${Array.from({ length: 20 }, (_, i) => `line${i}`).join('\n')}\n`;
    const lines = original.split('\n');
    lines[1] = 'CHANGED-TOP';
    lines[18] = 'CHANGED-BOTTOM';
    const fixed = lines.join('\n');
    const out = unifiedDiff('f.ts', original, fixed);
    const hunks = out.match(/@@ /g) ?? [];
    expect(hunks.length).toBe(2);
    expect(out).toContain('+CHANGED-TOP');
    expect(out).toContain('+CHANGED-BOTTOM');
  });

  it('handles pure insertions and deletions', () => {
    expect(unifiedDiff('f.ts', 'a\nb\n', 'a\nb\nc\n')).toContain('+c');
    expect(unifiedDiff('f.ts', 'a\nb\nc\n', 'a\nc\n')).toContain('-b');
  });
});
