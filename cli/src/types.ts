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

/**
 * The exact source span a fix replacement overwrites. Lines and columns are
 * 1-based (matching Semgrep); the end column is exclusive — it points at the
 * position just past the last replaced character, which lines up with both
 * VS Code ranges (after `-1`) and SARIF `endColumn` (used verbatim).
 *
 * Byte offsets are 0-based and `[startOffset, endOffset)`; they are present
 * whenever Semgrep reports them and let a consumer splice the file directly
 * without re-deriving offsets from line/column.
 */
export interface FixRange {
  startLine: number;
  startCol: number;
  endLine: number;
  endCol: number;
  startOffset?: number;
  endOffset?: number;
}

/**
 * Per-finding autofix data, surfaced when the matched rule ships a `fix:`
 * template. Carries the rendered replacement text plus the precise span it
 * overwrites, so an editor can apply the edit itself (without re-running the
 * CLI with `--fix`). Absent when the rule has no fix for this match.
 */
export interface FindingFix {
  /** Replacement text rendered from the rule's `fix:` template. */
  replacement: string;
  /** The exact span the replacement overwrites. */
  range: FixRange;
}

export interface Finding {
  /** Rule id, e.g. "auth.jwt.alg-none" */
  ruleId: string;
  /** OAuthLint-specific id, e.g. "AUTH-JWT-001" */
  oauthlintRuleId?: string;
  severity: SeverityName;
  filePath: string;
  startLine: number;
  endLine: number;
  /**
   * 1-based start/end columns of the match, mirroring Semgrep. The end column
   * is exclusive (it points just past the last matched character). Optional and
   * purely additive: surfaced when Semgrep reports them, and used to draw the
   * caret span under the offending line in the pretty code frame. Absent
   * findings simply render without a caret.
   */
  startCol?: number;
  endCol?: number;
  message: string;
  docUrl?: string;
  cwe?: string;
  llmPrevalence?: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Autofix data — present only when the rule ships a `fix:` for this match. */
  fix?: FindingFix;
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
  /**
   * Show a source code frame under each finding in the pretty output. Default
   * on; overridden by the `--no-code-frame` CLI flag.
   */
  codeFrame?: boolean;
}
