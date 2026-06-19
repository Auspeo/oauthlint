import { SEVERITIES, type SeverityName } from '../types.js';

/**
 * Lower index = less severe. Used for "fail if any finding ≥ threshold".
 */
export function severityRank(s: SeverityName): number {
  const idx = SEVERITIES.indexOf(s);
  return idx === -1 ? 0 : idx;
}

/**
 * Return true if `actual` meets or exceeds the `threshold` severity.
 */
export function meetsThreshold(actual: SeverityName, threshold: SeverityName): boolean {
  return severityRank(actual) >= severityRank(threshold);
}

/**
 * Map our 5-level scale to a process exit code:
 *  - 0  → no finding worth blocking on
 *  - 1  → at least one HIGH
 *  - 2  → at least one CRITICAL
 */
export function exitCodeFor(highest: SeverityName | null): number {
  if (highest === null) return 0;
  if (severityRank(highest) >= severityRank('CRITICAL')) return 2;
  if (severityRank(highest) >= severityRank('HIGH')) return 1;
  return 0;
}

/**
 * Find the highest severity in a list of findings.
 */
export function highestSeverity(findings: { severity: SeverityName }[]): SeverityName | null {
  let highest: SeverityName | null = null;
  for (const f of findings) {
    if (!highest || severityRank(f.severity) > severityRank(highest)) {
      highest = f.severity;
    }
  }
  return highest;
}
