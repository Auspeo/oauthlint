import { type Finding, type SeverityName, highestSeverity } from 'oauthlint';

/**
 * A single finding, trimmed to what an AI agent needs to act: which rule fired,
 * how serious it is, where (line range), why (message), the standards mapping
 * (CWE) and where to read more (doc URL). When the rule ships a deterministic
 * `fix:`, the replacement text is included so the agent can apply it verbatim.
 */
export interface ToolFinding {
  ruleId: string;
  oauthlintRuleId?: string;
  severity: SeverityName;
  /** 1-based start line of the match. */
  line: number;
  /** 1-based end line of the match. */
  endLine: number;
  message: string;
  cwe?: string;
  docUrl?: string;
  /** File the finding belongs to. Omitted for `scan_code` (a temp snippet). */
  file?: string;
  /** Autofix replacement text, present only when the rule ships a `fix:`. */
  fix?: string;
}

/** Structured result returned by `scan_code` / `scan_path`. */
export interface ScanToolResult {
  findingCount: number;
  highestSeverity: SeverityName | null;
  findings: ToolFinding[];
}

/** Project a CLI `Finding` onto the lean shape an agent consumes. */
export function toToolFinding(finding: Finding, includeFile: boolean): ToolFinding {
  const out: ToolFinding = {
    ruleId: finding.ruleId,
    severity: finding.severity,
    line: finding.startLine,
    endLine: finding.endLine,
    message: finding.message,
  };
  if (finding.oauthlintRuleId) out.oauthlintRuleId = finding.oauthlintRuleId;
  if (finding.cwe) out.cwe = finding.cwe;
  if (finding.docUrl) out.docUrl = finding.docUrl;
  if (includeFile) out.file = finding.filePath;
  if (finding.fix) out.fix = finding.fix.replacement;
  return out;
}

export function buildScanResult(findings: Finding[], includeFile: boolean): ScanToolResult {
  return {
    findingCount: findings.length,
    highestSeverity: highestSeverity(findings),
    findings: findings.map((f) => toToolFinding(f, includeFile)),
  };
}

/**
 * A short, human-readable summary of a scan. The MCP `content` block an agent
 * shows to a user; the machine-actionable detail lives in `structuredContent`.
 */
export function summariseScan(result: ScanToolResult, subject: string): string {
  if (result.findingCount === 0) {
    return `No OAuthLint findings in ${subject}.`;
  }
  const header =
    `${result.findingCount} OAuthLint finding${result.findingCount === 1 ? '' : 's'} ` +
    `in ${subject} (highest severity ${result.highestSeverity}).`;
  const lines = result.findings.map((f) => {
    const where = f.file ? `${f.file}:${f.line}` : `line ${f.line}`;
    const firstLine = f.message.split('\n')[0]?.trim() ?? '';
    const fix = f.fix ? ' (an autofix is available)' : '';
    return `- [${f.severity}] ${f.ruleId} at ${where}: ${firstLine}${fix}`;
  });
  return [header, ...lines].join('\n');
}
