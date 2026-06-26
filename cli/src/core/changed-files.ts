import { extname } from 'node:path';
import { execa } from 'execa';

/**
 * Raised when a git operation can't be performed — most commonly because the
 * target directory is not inside a git work tree, or `git` itself is missing.
 * Callers (the scan command) translate this into a clean, non-crashing error
 * message rather than a stack trace.
 */
export class GitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitError';
  }
}

/**
 * File extensions for the languages the rule pack supports
 * (javascript, typescript, python, go, java, rust). The change-set resolvers
 * filter to these so we never hand Semgrep a Markdown/lockfile/binary path:
 * incremental scanning only makes sense for source files semgrep can analyse,
 * and skipping the rest keeps the scan fast.
 *
 * Kept deliberately broad within each supported language (e.g. both `.mjs`
 * and `.cjs`) so a changed file is never silently dropped.
 */
const SUPPORTED_EXTENSIONS: ReadonlySet<string> = new Set([
  // JavaScript / TypeScript
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  // Python
  '.py',
  '.pyi',
  // Go
  '.go',
  // Java
  '.java',
  // Rust
  '.rs',
]);

/** True when `file` has an extension the rule pack can actually scan. */
export function isScannableSourceFile(file: string): boolean {
  return SUPPORTED_EXTENSIONS.has(extname(file).toLowerCase());
}

/**
 * Run `git` with the given args as an ARRAY (never a shell string), so user
 * input — branch names, refs — can't be interpreted by a shell. `execa`
 * spawns the process directly without `/bin/sh`, eliminating shell injection.
 *
 * @throws GitError when git is not installed or the command fails.
 */
async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execa('git', args, { cwd, reject: true });
    return stdout;
  } catch (err) {
    if (isMissingGitBinary(err)) {
      throw new GitError('git is not installed or not on PATH — cannot resolve changed files.');
    }
    const stderr =
      typeof (err as { stderr?: unknown }).stderr === 'string'
        ? (err as { stderr: string }).stderr.trim()
        : '';
    throw new GitError(stderr || (err instanceof Error ? err.message : String(err)));
  }
}

function isMissingGitBinary(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code === 'ENOENT' || e.cause?.code === 'ENOENT';
}

/**
 * Throw a clear GitError unless `cwd` is inside a git work tree. Used by the
 * diff/staged resolvers so "not a git repo" surfaces as a friendly message
 * instead of a confusing low-level git error.
 */
async function assertGitRepo(cwd: string): Promise<void> {
  let inside: string;
  try {
    inside = await git(cwd, ['rev-parse', '--is-inside-work-tree']);
  } catch (err) {
    if (err instanceof GitError && /not a git repository/i.test(err.message)) {
      throw new GitError(`Not a git repository: ${cwd}`);
    }
    throw err;
  }
  if (inside.trim() !== 'true') {
    throw new GitError(`Not a git repository: ${cwd}`);
  }
}

/**
 * Resolve the git ref to diff against when `--diff` is passed without a value.
 * We want the merge-base with the repository's default branch so a feature
 * branch only scans what it actually changed (not unrelated commits already on
 * the default branch). Resolution order:
 *
 *   1. `origin/HEAD` — the remote's default branch symref (most accurate)
 *   2. `origin/main`
 *   3. `origin/master`
 *   4. `HEAD` — fallback when there is no remote (diffs only the work tree)
 *
 * For each candidate we use its merge-base with the current HEAD so the diff
 * is scoped to the branch's own changes.
 */
async function resolveDefaultRef(cwd: string): Promise<string> {
  for (const candidate of ['origin/HEAD', 'origin/main', 'origin/master']) {
    try {
      const base = (await git(cwd, ['merge-base', candidate, 'HEAD'])).trim();
      if (base) return base;
    } catch {
      // candidate doesn't exist (no remote / different default) — try the next.
    }
  }
  return 'HEAD';
}

/** Absolute repo root for `cwd`, used to turn git's repo-relative paths absolute. */
async function repoRoot(cwd: string): Promise<string> {
  return (await git(cwd, ['rev-parse', '--show-toplevel'])).trim();
}

function toAbsolute(root: string, relPaths: string[]): string[] {
  // git emits forward-slash, repo-relative paths; join under the repo root.
  return relPaths
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `${root}/${p}`);
}

/**
 * Files changed versus `ref` (or the default branch's merge-base when `ref` is
 * undefined), as absolute paths, filtered to scannable source files.
 *
 * Combines four sets so nothing in flight is missed:
 *   - committed changes since `ref`     (`git diff --name-only <ref>...`)
 *   - unstaged work-tree changes        (`git diff --name-only`)
 *   - staged-but-uncommitted changes    (`git diff --name-only --cached`)
 *   - new, not-yet-tracked files        (`git ls-files --others --exclude-standard`)
 *
 * `--diff-filter=ACMR` keeps Added / Copied / Modified / Renamed and drops
 * Deleted files (we can't scan a file that no longer exists). Untracked files
 * are picked up separately because plain `git diff` only reports tracked paths —
 * a freshly written, un-`add`ed source file would otherwise be missed.
 *
 * @throws GitError when not in a git repo (or git is unavailable).
 */
export async function resolveDiffFiles(cwd: string, ref?: string): Promise<string[]> {
  await assertGitRepo(cwd);
  const baseRef = ref ?? (await resolveDefaultRef(cwd));
  const root = await repoRoot(cwd);

  const seen = new Set<string>();
  const batches = await Promise.all([
    // `<ref>...` (three-dot) diffs against the merge-base of ref and HEAD,
    // matching how code review compares a branch to its base.
    git(cwd, ['diff', '--name-only', '--diff-filter=ACMR', `${baseRef}...`]),
    git(cwd, ['diff', '--name-only', '--diff-filter=ACMR']),
    git(cwd, ['diff', '--name-only', '--cached', '--diff-filter=ACMR']),
    // Untracked (but not git-ignored) files — `git diff` never lists these.
    git(cwd, ['ls-files', '--others', '--exclude-standard']),
  ]);
  for (const out of batches) {
    for (const abs of toAbsolute(root, out.split('\n'))) seen.add(abs);
  }
  return [...seen].filter(isScannableSourceFile).sort();
}

/**
 * Staged files (`git diff --name-only --cached --diff-filter=ACMR`) as absolute
 * paths, filtered to scannable source files. This is the set a pre-commit hook
 * cares about.
 *
 * @throws GitError when not in a git repo (or git is unavailable).
 */
export async function resolveStagedFiles(cwd: string): Promise<string[]> {
  await assertGitRepo(cwd);
  const root = await repoRoot(cwd);
  const out = await git(cwd, ['diff', '--name-only', '--cached', '--diff-filter=ACMR']);
  const abs = toAbsolute(root, out.split('\n'));
  return [...new Set(abs)].filter(isScannableSourceFile).sort();
}
