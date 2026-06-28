import { relative } from 'node:path';
import pc from 'picocolors';
import type { FixPlan } from '../adapters/semgrep.js';
import { unifiedDiff } from './diff.js';

/** `path`, relative to `cwd` when that's shorter/cleaner; absolute otherwise. */
function label(path: string, cwd: string): string {
  const rel = relative(cwd, path);
  return rel && !rel.startsWith('..') ? rel : path;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return n === 1 ? one : many;
}

/**
 * Render the `--fix-dry-run` preview: a unified diff per file that `--fix` would
 * rewrite, followed by a one-line summary. Returns a note when nothing is
 * fixable so the user always gets clear feedback.
 */
export function renderFixPreview(plan: FixPlan, opts: { cwd: string; color: boolean }): string {
  if (plan.files.length === 0) {
    return `\n${pc.dim('No autofixable findings — nothing to preview.')}\n`;
  }

  const parts: string[] = [
    `\n${pc.bold('Fix preview')} ${pc.dim('(dry run — no files were changed)')}\n`,
  ];
  for (const file of plan.files) {
    const name = label(file.path, opts.cwd);
    parts.push(unifiedDiff(name, file.original, file.fixed, { color: opts.color }));
  }
  parts.push(
    `${pc.dim(
      `${plan.totalFixes} ${plural(plan.totalFixes, 'fix', 'fixes')} across ${plan.files.length} ${plural(
        plan.files.length,
        'file',
      )} would be applied. Re-run with ${pc.bold('--fix')} to write them.`,
    )}\n`,
  );
  return parts.join('\n');
}

/**
 * Render the post-`--fix` summary: which files changed and how many fixes were
 * applied. When nothing changed (e.g. a second `--fix` run — fixes are
 * idempotent) it says so explicitly rather than printing a misleading hint.
 */
export function renderFixSummary(plan: FixPlan, opts: { cwd: string }): string {
  if (plan.files.length === 0) {
    return `\n${pc.dim('🛠 No autofixable findings — no files were changed.')}\n`;
  }
  const lines = [
    `\n${pc.bold('🛠 Applied')} ${plan.totalFixes} ${plural(
      plan.totalFixes,
      'fix',
      'fixes',
    )} across ${plan.files.length} ${plural(plan.files.length, 'file')}:`,
  ];
  for (const file of plan.files) {
    lines.push(
      `  ${pc.green('✓')} ${label(file.path, opts.cwd)} ${pc.dim(
        `(${file.fixCount} ${plural(file.fixCount, 'fix', 'fixes')})`,
      )}`,
    );
  }
  lines.push(pc.dim('Review the changes and re-run `oauthlint scan` to confirm.'));
  return `${lines.join('\n')}\n`;
}
