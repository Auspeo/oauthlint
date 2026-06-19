/**
 * Severity used both for filtering and for exit-code decisions.
 * Order matters: items later in the array are considered "worse".
 */
export const SEVERITIES = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type SeverityName = (typeof SEVERITIES)[number];

/**
 * Map raw Semgrep severities to our 5-level scale.
 * Semgrep itself only emits INFO / WARNING / ERROR, but each rule can
 * additionally declare its own severity metadata; we honour rule metadata
 * when present.
 */
export const SEMGREP_SEVERITY_MAP: Record<string, SeverityName> = {
  INFO: 'INFO',
  WARNING: 'MEDIUM',
  ERROR: 'HIGH',
};

export interface Finding {
  /** Rule id, e.g. "auth.jwt.alg-none" */
  ruleId: string;
  /** OAuthLint-specific id, e.g. "AUTH-JWT-001" */
  oauthlintRuleId?: string;
  severity: SeverityName;
  filePath: string;
  startLine: number;
  endLine: number;
  message: string;
  docUrl?: string;
  cwe?: string;
  llmPrevalence?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface ScanResult {
  findings: Finding[];
  scannedFiles: number;
  durationMs: number;
  semgrepVersion: string | null;
  errors: string[];
}

export interface OAuthLintConfig {
  include?: string[];
  exclude?: string[];
  rules?: Record<string, 'off' | 'warn' | SeverityName>;
  customRulesDir?: string;
  failOn?: SeverityName | 'off';
}
