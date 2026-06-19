/**
 * Build the line of source that, inserted ABOVE the offending line,
 * suppresses OAuthLint for that one line. Mirrors the disable directive
 * recognised by the CLI's `applySuppressions` (packages/oauthlint-cli/
 * src/core/suppress.ts).
 *
 * Kept in its own file so the VS Code code-action provider can unit-test
 * the output without dragging in the `vscode` runtime module.
 */
export interface BuildDirectiveOptions {
  ruleId: string;
  /** Optional reason — appended after `-- ` for code-review hygiene. */
  reason?: string;
  /** Leading whitespace to preserve indentation of the wrapped line. */
  indent?: string;
  /** Block comment (`/*`) for languages without `//`. Defaults to line comment. */
  block?: boolean;
}

export function buildDisableNextLineDirective(opts: BuildDirectiveOptions): string {
  const indent = opts.indent ?? '';
  const reason = opts.reason?.trim();
  const body = reason
    ? `oauthlint-disable-next-line ${opts.ruleId} -- ${reason}`
    : `oauthlint-disable-next-line ${opts.ruleId}`;
  return opts.block ? `${indent}/* ${body} */` : `${indent}// ${body}`;
}

export function buildDisableFileDirective(opts: BuildDirectiveOptions): string {
  const reason = opts.reason?.trim();
  const body = reason
    ? `oauthlint-disable-file ${opts.ruleId} -- ${reason}`
    : `oauthlint-disable-file ${opts.ruleId}`;
  return opts.block ? `/* ${body} */` : `// ${body}`;
}

/** Extract the leading whitespace from a source line. */
export function leadingIndent(line: string): string {
  const match = line.match(/^\s*/);
  return match ? match[0] : '';
}
