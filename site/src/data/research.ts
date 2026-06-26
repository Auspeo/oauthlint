/**
 * OAuthLint research report — single source of truth for every figure on
 * `/research`. The page renders ENTIRELY from this object; no statistic is
 * hardcoded in the markup, so the numbers can be finalised here in one place
 * before publishing without touching the page.
 *
 * 100% AGGREGATE. This file MUST NOT name, list, link, or otherwise identify
 * any specific repository, organisation, person, or GitHub user, and MUST NOT
 * attribute findings to any specific AI tool. Frame everything as patterns
 * common in AI-generated code in general. The corpus is described only as a
 * category: public repositories self-identifying as AI-generated / vibe-coded
 * applications.
 *
 * Provisional values below — overwrite with the final measured numbers before
 * shipping. The page renders whatever is here faithfully.
 */

/** One row of the "most common patterns" table. */
export interface ResearchPattern {
  /** Plain-language pattern name (neutral; never tool-specific). */
  label: string;
  /** CWE identifier, linked via `cweUrl()`. */
  cwe: string;
  /** Rule slug — links to `/rules/<ruleSlug>` (the "why + how to fix" page). */
  ruleSlug: string;
  /** Raw count of findings for this pattern across the corpus. */
  findings: number;
  /** Percentage of scanned repositories with at least one of these findings. */
  reposPct: number;
}

export interface ResearchData {
  /** Last-updated date (ISO 8601) for the snapshot. */
  updatedISO: string;
  /** OAuthLint version the scan was run with. */
  toolVersion: string;
  /** Total public repositories scanned. */
  reposScanned: number;
  /** Repositories with at least one finding. */
  reposWithFindings: number;
  /** Percentage of scanned repos with ≥1 finding. */
  pctWithFindings: number;
  /** Percentage of scanned repos with at least one HIGH+ finding. */
  pctHigh: number;
  /** Total findings across the corpus. */
  totalFindings: number;
  /** Mean findings per affected repository. */
  avgPerAffected: number;
  /** Share of findings on rules tagged HIGH-prevalence in AI-generated code. */
  llmPrevalenceHighPct: number;
  /** Severity distribution of all findings. */
  severity: { high: number; medium: number; low: number };
  /** Most common patterns, highest-impact first. */
  topPatterns: ResearchPattern[];
  /** Findings grouped by rule category. */
  byCategory: { category: string; findings: number }[];
  /** Affected repositories grouped by primary language. */
  byLanguage: { language: string; repos: number }[];
}

export const research: ResearchData = {
  updatedISO: '2026-06-27',
  toolVersion: '0.4.0',
  reposScanned: 132,
  reposWithFindings: 35,
  pctWithFindings: 27, // %
  pctHigh: 18, // % with a HIGH+ finding
  totalFindings: 283,
  avgPerAffected: 8.1,
  llmPrevalenceHighPct: 57, // % of findings on rules tagged HIGH prevalence in AI code
  severity: { high: 77, medium: 178, low: 28 },
  topPatterns: [
    {
      label: 'Non-constant-time secret comparison',
      cwe: 'CWE-208',
      ruleSlug: 'flow-timing-unsafe-compare',
      findings: 75,
      reposPct: 13,
    },
    {
      label: 'Auth tokens in browser storage',
      cwe: 'CWE-922',
      ruleSlug: 'jwt-localstorage',
      findings: 60,
      reposPct: 8,
    },
    {
      label: 'Session identifier in the URL',
      cwe: 'CWE-598',
      ruleSlug: 'session-id-in-url',
      findings: 27,
      reposPct: 8,
    },
    {
      label: 'Hard-coded provider / API keys',
      cwe: 'CWE-798',
      ruleSlug: 'secret-provider-key',
      findings: 27,
      reposPct: 5,
    },
    {
      label: 'No rate limiting on auth endpoints',
      cwe: 'CWE-307',
      ruleSlug: 'flow-no-rate-limit',
      findings: 23,
      reposPct: 4,
    },
    {
      label: 'Secrets written to logs',
      cwe: 'CWE-532',
      ruleSlug: 'flow-secret-in-log',
      findings: 8,
      reposPct: 2,
    },
  ],
  byCategory: [
    { category: 'flow', findings: 115 },
    { category: 'jwt', findings: 76 },
    { category: 'secret', findings: 28 },
    { category: 'session', findings: 27 },
    { category: 'oauth', findings: 16 },
    { category: 'tls', findings: 6 },
  ],
  byLanguage: [
    { language: 'TypeScript', repos: 98 },
    { language: 'JavaScript', repos: 14 },
    { language: 'HTML', repos: 9 },
    { language: 'Python', repos: 8 },
  ],
};
