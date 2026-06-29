import { Writable } from 'node:stream';
import { type ExplainedRule, type SeverityName, runExplain } from 'oauthlint';
import { buildManifest } from 'oauthlint-rules';
import { ToolError } from './errors.js';
import type { Language } from './languages.js';

/** A Writable that accumulates everything written to it into a string. */
function collector(): { stream: Writable; text: () => string } {
  const chunks: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, done) {
      chunks.push(chunk.toString());
      done();
    },
  });
  return { stream, text: () => chunks.join('') };
}

/** Map a rule's declared Semgrep severity onto the 5-level finding scale. */
const FINDING_SEVERITY: Record<string, SeverityName> = {
  INFO: 'INFO',
  WARNING: 'MEDIUM',
  ERROR: 'HIGH',
};

/**
 * Explain a single rule, reusing the CLI's `explain --json` machinery so the
 * MCP output stays identical to what `oauthlint explain` produces (severity,
 * CWE, OWASP, the why/how-to-fix message, and vulnerable/safe examples). We
 * capture the command's JSON on an in-memory stream rather than re-deriving the
 * data.
 */
export async function explainRule(rule: string): Promise<ExplainedRule> {
  const out = collector();
  const err = collector();
  const code = await runExplain({ rule, json: true, stream: out.stream, errStream: err.stream });
  if (code !== 0) {
    throw new ToolError(
      `Unknown rule "${rule}". Pass a rule id (auth.jwt.alg-none), a slug (jwt-alg-none), or an oauthlint-rule-id (AUTH-JWT-001). Use list_rules to browse them.`,
    );
  }
  return JSON.parse(out.text()) as ExplainedRule;
}

export interface ListRulesArgs {
  language?: Language;
  minSeverity?: SeverityName;
}

/** A catalogue entry: enough to pick a rule and then drill in with explain_rule. */
export interface RuleCatalogueEntry {
  id: string;
  oauthlintRuleId: string;
  title: string;
  severity: SeverityName;
  languages: string[];
  cwe: string | null;
  docUrl: string;
}

const SEVERITY_RANK: Record<SeverityName, number> = {
  INFO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

/**
 * List the shipped rules, with optional filters. Built from the same manifest
 * that backs `oauthlint list`. Severity is reported on the 5-level finding
 * scale so it lines up with what a scan returns.
 */
export async function listRules(args: ListRulesArgs = {}): Promise<RuleCatalogueEntry[]> {
  const manifest = await buildManifest();
  const minRank = args.minSeverity ? SEVERITY_RANK[args.minSeverity] : 0;

  return manifest
    .map((entry) => ({
      id: entry.id,
      oauthlintRuleId: entry.oauthlintId,
      title: entry.description,
      severity: FINDING_SEVERITY[entry.severity] ?? 'MEDIUM',
      languages: entry.languages,
      cwe: entry.cwe ?? null,
      docUrl: entry.docUrl,
    }))
    .filter((entry) => !args.language || entry.languages.includes(args.language))
    .filter((entry) => SEVERITY_RANK[entry.severity] >= minRank);
}
