/**
 * Translate a finding's CLI-shaped `fix` into the 0-based coordinates VS Code
 * uses for ranges and edits. Kept in its own module — free of the `vscode`
 * runtime — so the mapping can be unit-tested directly (the same way
 * `suppressions.ts` and `statusbar.ts` are), with the extension layer turning
 * the plain result into a `vscode.Range` / `WorkspaceEdit`.
 */
import type { OAuthLintFinding } from './runner.js';

/**
 * A resolved, 0-based edit ready to map onto a `vscode.Range` and a
 * `WorkspaceEdit.replace(...)`. VS Code positions are 0-based for both line and
 * character, and a range's end is exclusive — which lines up with the CLI's
 * 1-based, end-exclusive columns after subtracting one.
 */
export interface ApplyFixEdit {
  startLine: number;
  startCharacter: number;
  endLine: number;
  endCharacter: number;
  /** Text written over the range. */
  replacement: string;
  /** Title for the Quick Fix action. */
  title: string;
}

/**
 * Build the apply-fix edit for a finding, or `undefined` when the finding
 * carries no fix (so the caller offers no "Apply fix" action). The CLI reports
 * a 1-based line/column span; we convert to VS Code's 0-based coordinates and
 * clamp at zero so a malformed `1`-or-below never produces a negative index.
 */
export function buildApplyFixEdit(finding: OAuthLintFinding): ApplyFixEdit | undefined {
  const fix = finding.fix;
  if (!fix) return undefined;

  const { range, replacement } = fix;
  return {
    startLine: Math.max(0, range.startLine - 1),
    startCharacter: Math.max(0, range.startCol - 1),
    endLine: Math.max(0, range.endLine - 1),
    endCharacter: Math.max(0, range.endCol - 1),
    replacement,
    title: `Apply OAuthLint fix for ${finding.ruleId}`,
  };
}
