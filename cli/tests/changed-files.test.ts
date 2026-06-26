import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execa } from 'execa';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  GitError,
  isScannableSourceFile,
  resolveDiffFiles,
  resolveStagedFiles,
} from '../src/core/changed-files.js';

/** Run git in `cwd`, throwing on failure (test helper — keeps setup terse). */
async function git(cwd: string, ...args: string[]): Promise<void> {
  await execa('git', args, { cwd });
}

/**
 * Create a deterministic, isolated git repo with one initial commit on `main`.
 * Returns the *canonical* path (git reports paths under its real toplevel; on
 * macOS `/var` symlinks to `/private/var`, so we resolve up front to compare).
 */
async function makeRepo(): Promise<string> {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'oauthlint-git-')));
  await git(dir, 'init', '-q', '-b', 'main');
  await git(dir, 'config', 'user.email', 'test@oauthlint.dev');
  await git(dir, 'config', 'user.name', 'Test');
  // Disable signing / hooks so the test never blocks on local config.
  await git(dir, 'config', 'commit.gpgsign', 'false');
  await writeFile(join(dir, 'base.ts'), 'export const base = 1;\n');
  await git(dir, 'add', '.');
  await git(dir, 'commit', '-q', '-m', 'initial');
  return dir;
}

describe('isScannableSourceFile', () => {
  it('accepts supported source extensions across languages', () => {
    for (const f of ['a.ts', 'b.tsx', 'c.js', 'd.mjs', 'e.py', 'f.go', 'g.java', 'h.rs']) {
      expect(isScannableSourceFile(f)).toBe(true);
    }
  });

  it('rejects non-source files (docs, lockfiles, configs)', () => {
    for (const f of ['README.md', 'pnpm-lock.yaml', 'image.png', 'data.json', 'Makefile']) {
      expect(isScannableSourceFile(f)).toBe(false);
    }
  });
});

describe('resolveStagedFiles', () => {
  let repo: string;
  beforeEach(async () => {
    repo = await makeRepo();
  });
  afterEach(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  it('returns only staged source files (absolute paths)', async () => {
    await writeFile(join(repo, 'staged.ts'), 'export const a = 1;\n');
    await writeFile(join(repo, 'unstaged.ts'), 'export const b = 2;\n');
    await writeFile(join(repo, 'notes.md'), '# notes\n');
    await git(repo, 'add', 'staged.ts', 'notes.md');

    const files = await resolveStagedFiles(repo);
    expect(files).toEqual([join(repo, 'staged.ts')]);
  });

  it('returns an empty array when nothing is staged', async () => {
    expect(await resolveStagedFiles(repo)).toEqual([]);
  });

  it('omits staged-but-deleted files (--diff-filter drops D)', async () => {
    await git(repo, 'rm', '-q', 'base.ts');
    expect(await resolveStagedFiles(repo)).toEqual([]);
  });
});

describe('resolveDiffFiles', () => {
  let repo: string;
  beforeEach(async () => {
    repo = await makeRepo();
  });
  afterEach(async () => {
    await rm(repo, { recursive: true, force: true });
  });

  it('returns committed + working-tree changes vs an explicit ref', async () => {
    const baseRef = (await execa('git', ['rev-parse', 'HEAD'], { cwd: repo })).stdout.trim();

    // A committed change on top of the base ref...
    await writeFile(join(repo, 'committed.ts'), 'export const c = 1;\n');
    await git(repo, 'add', 'committed.ts');
    await git(repo, 'commit', '-q', '-m', 'add committed');
    // ...plus an unstaged working-tree change...
    await writeFile(join(repo, 'working.ts'), 'export const w = 1;\n');
    // ...plus a changed file we should NOT scan (wrong language).
    await writeFile(join(repo, 'changed.md'), '# changed\n');

    const files = await resolveDiffFiles(repo, baseRef);
    expect(files).toEqual([join(repo, 'committed.ts'), join(repo, 'working.ts')]);
  });

  it('returns an empty array when nothing changed vs the ref', async () => {
    const head = (await execa('git', ['rev-parse', 'HEAD'], { cwd: repo })).stdout.trim();
    expect(await resolveDiffFiles(repo, head)).toEqual([]);
  });

  it('defaults to HEAD when no remote/default branch exists (scans only the work tree)', async () => {
    await writeFile(join(repo, 'new.ts'), 'export const n = 1;\n');
    // No ref passed → resolver falls back through origin/* to HEAD.
    const files = await resolveDiffFiles(repo);
    expect(files).toEqual([join(repo, 'new.ts')]);
  });
});

describe('git safety / error handling', () => {
  it('raises a clear GitError when the directory is not a git repo', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'oauthlint-nogit-'));
    try {
      await expect(resolveDiffFiles(dir)).rejects.toBeInstanceOf(GitError);
      await expect(resolveStagedFiles(dir)).rejects.toThrow(/Not a git repository/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('does not interpret a malicious ref through a shell (args passed as array)', async () => {
    const repo = await makeRepo();
    try {
      // If we ever shelled out, this would try to `touch pwned`. Because args
      // are passed as an array, git just treats it as a (bad) ref and errors —
      // surfacing as GitError, never executing the injected command.
      await expect(resolveDiffFiles(repo, '$(touch pwned)')).rejects.toBeInstanceOf(GitError);
    } finally {
      await rm(repo, { recursive: true, force: true });
    }
  });
});
