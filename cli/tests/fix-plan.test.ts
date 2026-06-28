import { describe, expect, it } from 'vitest';
import type { FixPlan } from '../src/adapters/semgrep.js';
import { renderFixPreview, renderFixSummary } from '../src/core/fix-plan.js';

const plan = (files: FixPlan['files']): FixPlan => ({
  files,
  totalFixes: files.reduce((n, f) => n + f.fixCount, 0),
});

describe('renderFixPreview', () => {
  it('renders a diff per file and a re-run hint', () => {
    const out = renderFixPreview(
      plan([
        {
          path: '/proj/a.go',
          original: 'Secure: false\n',
          fixed: 'Secure: true\n',
          fixCount: 1,
        },
        {
          path: '/proj/b.rs',
          original: 'x(true)\n',
          fixed: 'x(false)\n',
          fixCount: 1,
        },
      ]),
      { cwd: '/proj', color: false },
    );
    expect(out).toContain('Fix preview');
    expect(out).toContain('dry run');
    // Paths are shown relative to cwd.
    expect(out).toContain('--- a/a.go');
    expect(out).toContain('--- a/b.rs');
    expect(out).toContain('2 fixes across 2 files');
    expect(out).toContain('--fix');
  });

  it('uses singular wording for a single fix', () => {
    const out = renderFixPreview(
      plan([{ path: '/p/x.ts', original: 'a\n', fixed: 'b\n', fixCount: 1 }]),
      { cwd: '/p', color: false },
    );
    expect(out).toContain('1 fix across 1 file');
  });

  it('notes when there is nothing to preview', () => {
    expect(renderFixPreview(plan([]), { cwd: '/p', color: false })).toContain('nothing to preview');
  });
});

describe('renderFixSummary', () => {
  it('lists changed files with per-file fix counts', () => {
    const out = renderFixSummary(
      plan([
        { path: '/proj/a.go', original: 'a\n', fixed: 'b\n', fixCount: 2 },
        { path: '/proj/nested/c.go', original: 'c\n', fixed: 'd\n', fixCount: 1 },
      ]),
      { cwd: '/proj' },
    );
    expect(out).toContain('Applied 3 fixes across 2 files');
    expect(out).toContain('a.go');
    expect(out).toContain('(2 fixes)');
    expect(out).toContain('nested/c.go');
    expect(out).toContain('(1 fix)');
  });

  it('reports a no-op for an empty plan (idempotent re-run)', () => {
    expect(renderFixSummary(plan([]), { cwd: '/p' })).toContain('no files were changed');
  });
});
