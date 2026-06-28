/**
 * Pure presentation logic for the OAuthLint finding hover.
 *
 * Kept free of the `vscode` runtime so the (finding -> Markdown) mapping can be
 * unit-tested without the Extension Development Host. `extension.ts` owns the
 * HoverProvider: it matches a hovered position to one of its own diagnostics,
 * then renders the string this module builds into a `vscode.MarkdownString`.
 */

/** The subset of an OAuthLint finding the hover renders. */
export interface FindingHoverData {
  /** Semgrep/canonical rule id, e.g. `auth.jwt.alg-none`. */
  ruleId: string;
  /** OAuthLint's stable rule id, surfaced alongside `ruleId` when distinct. */
  oauthlintRuleId?: string;
  /** Severity label as emitted by the CLI (INFO…CRITICAL). */
  severity: string;
  /** Full finding message — the "why" plus the fix. */
  message: string;
  /** Link to the rule's documentation page. */
  docUrl?: string;
  /** CWE reference, when the finding carries one (e.g. `CWE-347`). */
  cwe?: string;
  /** OWASP reference, when the finding carries one (e.g. `A02:2021`). */
  owasp?: string;
}

/**
 * Build the Markdown body shown when hovering an OAuthLint finding. Pure: no
 * side effects, no `vscode` imports. Optional fields are omitted rather than
 * fabricated, so a finding without a CWE/OWASP/doc link simply renders the
 * rule id, severity and message.
 */
export function buildFindingHoverMarkdown(data: FindingHoverData): string {
  const oauthlintRuleId = data.oauthlintRuleId?.trim();
  const ruleLabel =
    oauthlintRuleId && oauthlintRuleId !== data.ruleId
      ? `\`${oauthlintRuleId}\` (\`${data.ruleId}\`)`
      : `\`${data.ruleId}\``;

  const sections: string[] = [
    `**OAuthLint** · ${ruleLabel}`,
    `**Severity:** ${data.severity}`,
    data.message.trim(),
  ];

  const refs: string[] = [];
  if (data.cwe?.trim()) refs.push(`**CWE:** ${data.cwe.trim()}`);
  if (data.owasp?.trim()) refs.push(`**OWASP:** ${data.owasp.trim()}`);
  if (refs.length > 0) sections.push(refs.join(' · '));

  const docUrl = data.docUrl?.trim();
  if (docUrl) sections.push(`[View documentation](${docUrl})`);

  return sections.join('\n\n');
}
