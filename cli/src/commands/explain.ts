import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { type LoadedRule, RULES_ROOT, loadAllRules } from 'oauthlint-rules';
import pc from 'picocolors';
import { SEMGREP_SEVERITY_MAP, type SeverityName } from '../types.js';

export interface ExplainOptions {
  /** The rule to explain — a rule id, slug, or oauthlint-rule-id. */
  rule: string;
  /** When true, emit the structured rule object as JSON instead of pretty output. */
  json?: boolean;
  /** Stream to write the explanation to (defaults to process.stdout). */
  stream?: NodeJS.WritableStream;
  /** Stream for errors / chrome (defaults to process.stderr). */
  errStream?: NodeJS.WritableStream;
  /** Override the bundled rules root (used by tests). */
  rulesRoot?: string;
}

interface CodeExample {
  /** Absolute path to the fixture file the example was read from. */
  file: string;
  /** The fixture source, with Semgrep test annotations stripped. */
  code: string;
}

/** The structured object emitted by `--json` and rendered by the pretty path. */
export interface ExplainedRule {
  id: string;
  oauthlintRuleId: string;
  slug: string;
  /** Rule-declared Semgrep severity (INFO | WARNING | ERROR). */
  severity: string;
  /** The 5-level severity a scan finding would carry (mapped from `severity`). */
  findingSeverity: SeverityName;
  /** Rule family taken from the id, e.g. `jwt`, `oauth`, `cookie`. */
  category: string;
  /** Language segment of the id for language packs (e.g. `py`, `go`), else null. */
  language: string | null;
  languages: string[];
  cwe: string | null;
  cweUrl: string | null;
  owasp: string | null;
  owaspUrl: string | null;
  llmPrevalence: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  docUrl: string;
  references: string[];
  technology: string[];
  examples: {
    vulnerable: CodeExample | null;
    safe: CodeExample | null;
  };
}

/**
 * `oauthlint explain <rule>` — bring the rule docs into the terminal.
 *
 * Resolves `<rule>` offline from the bundled pack by rule id
 * (`auth.jwt.alg-none`), slug (`jwt-alg-none`), or oauthlint-rule-id
 * (`AUTH-JWT-001`), then prints the why/how-to-fix plus the vulnerable & safe
 * code examples. `--json` emits the structured rule object instead.
 */
export async function runExplain(opts: ExplainOptions): Promise<number> {
  const out = opts.stream ?? process.stdout;
  const err = opts.errStream ?? process.stderr;
  const rulesRoot = opts.rulesRoot ?? RULES_ROOT;

  const rules = await loadAllRules(rulesRoot);
  const match = resolveRule(rules, opts.rule);
  if (!match) {
    err.write(unknownRuleMessage(opts.rule));
    return 1;
  }

  const explained = await describeRule(match, rulesRoot);

  if (opts.json) {
    out.write(`${JSON.stringify(explained, null, 2)}\n`);
    return 0;
  }

  out.write(renderPretty(explained));
  return 0;
}

/**
 * Resolve any of the three accepted identifiers to a single rule.
 * Matching is case-insensitive so `auth-jwt-001` and `AUTH-JWT-001` both work.
 */
function resolveRule(rules: LoadedRule[], query: string): LoadedRule | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    rules.find(({ rule }) => rule.id.toLowerCase() === q) ??
    rules.find(({ rule }) => rule.metadata['oauthlint-rule-id'].toLowerCase() === q) ??
    rules.find(({ rule }) => slugFor(rule.metadata['oauthlint-doc-url']) === q) ??
    null
  );
}

/** The canonical slug is the last path segment of the rule's doc URL. */
function slugFor(docUrl: string): string {
  return (
    docUrl
      .split('/')
      .filter((s) => s.length > 0)
      .pop() ?? ''
  ).toLowerCase();
}

async function describeRule(loaded: LoadedRule, rulesRoot: string): Promise<ExplainedRule> {
  const { rule } = loaded;
  const meta = rule.metadata;
  const slug = slugFor(meta['oauthlint-doc-url']);
  const { category, language } = parseId(rule.id);
  const cwe = meta.cwe ?? null;
  const owasp = meta.owasp ?? null;

  const fixtureDir = resolve(rulesRoot, '..', 'tests', 'fixtures', slug);
  const [vulnerable, safe] = await Promise.all([
    readExample(fixtureDir, 'vulnerable'),
    readExample(fixtureDir, 'safe'),
  ]);

  return {
    id: rule.id,
    oauthlintRuleId: meta['oauthlint-rule-id'],
    slug,
    severity: rule.severity,
    findingSeverity: SEMGREP_SEVERITY_MAP[rule.severity] ?? 'INFO',
    category,
    language,
    languages: rule.languages,
    cwe,
    cweUrl: cwe ? cweUrl(cwe) : null,
    owasp,
    owaspUrl: owasp ? owaspUrl(owasp) : null,
    llmPrevalence: meta['llm-prevalence'],
    message: rule.message.trim(),
    docUrl: meta['oauthlint-doc-url'],
    references: meta.references ?? [],
    technology: meta.technology ?? [],
    examples: { vulnerable, safe },
  };
}

/**
 * Rule ids are `auth.<category>.<name>` or `auth.<lang>.<category>.<name>`.
 * The category is always the second-to-last segment; a 4-segment id carries a
 * language in the second segment.
 */
function parseId(id: string): { category: string; language: string | null } {
  const parts = id.split('.');
  const category = parts[parts.length - 2] ?? '';
  const language = parts.length >= 4 ? (parts[1] ?? null) : null;
  return { category, language };
}

/**
 * Read a fixture (`vulnerable.<ext>` / `safe.<ext>`) for a rule, best-effort.
 * Fixtures are not guaranteed to ship in every install, so a missing file is
 * not an error — the example is simply omitted. Semgrep test annotation
 * comments (`// ruleid:`, `// ok:`) are stripped so the example reads cleanly.
 */
async function readExample(
  fixtureDir: string,
  kind: 'vulnerable' | 'safe',
): Promise<CodeExample | null> {
  let entries: string[];
  try {
    entries = await readdir(fixtureDir);
  } catch {
    return null;
  }
  const fileName = entries.find((e) => e === kind || e.startsWith(`${kind}.`));
  if (!fileName) return null;
  const file = resolve(fixtureDir, fileName);
  try {
    const raw = await readFile(file, 'utf8');
    return { file, code: stripAnnotations(raw) };
  } catch {
    return null;
  }
}

/** Drop Semgrep fixture annotation comments and trim surrounding blank lines. */
function stripAnnotations(src: string): string {
  const lines = src
    .split('\n')
    .filter((line) => !/^\s*(?:\/\/|#)\s*(?:todo)?(?:ruleid|ok):/i.test(line));
  // Trim leading/trailing blank lines left behind by stripped annotations.
  while (lines.length > 0 && lines[0]?.trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === '') lines.pop();
  return lines.join('\n');
}

function unknownRuleMessage(query: string): string {
  const hint = pc.dim(
    'Pass a rule id (auth.jwt.alg-none), a slug (jwt-alg-none), or an oauthlint-rule-id (AUTH-JWT-001).',
  );
  const list = `${pc.dim('Run')} ${pc.bold('oauthlint list')} ${pc.dim('to see every rule this install ships with.')}`;
  return `${pc.red(`✗ Unknown rule "${query}".`)}\n\n${hint}\n${list}\n`;
}

// ── Canonical reference URLs ───────────────────────────────────────────────

function cweUrl(cwe: string): string {
  const num = cwe.replace(/^CWE-/i, '');
  return `https://cwe.mitre.org/data/definitions/${num}.html`;
}

const OWASP_2021: Record<string, string> = {
  A01: 'A01_2021-Broken_Access_Control',
  A02: 'A02_2021-Cryptographic_Failures',
  A03: 'A03_2021-Injection',
  A04: 'A04_2021-Insecure_Design',
  A05: 'A05_2021-Security_Misconfiguration',
  A06: 'A06_2021-Vulnerable_and_Outdated_Components',
  A07: 'A07_2021-Identification_and_Authentication_Failures',
  A08: 'A08_2021-Software_and_Data_Integrity_Failures',
  A09: 'A09_2021-Security_Logging_and_Monitoring_Failures',
  A10: 'A10_2021-Server-Side_Request_Forgery_%28SSRF%29',
};

const OWASP_API_2023: Record<string, string> = {
  API1: '0xa1-broken-object-level-authorization',
  API2: '0xa2-broken-authentication',
  API3: '0xa3-broken-object-property-level-authorization',
  API4: '0xa4-unrestricted-resource-consumption',
  API5: '0xa5-broken-function-level-authorization',
  API6: '0xa6-unrestricted-access-to-sensitive-business-flows',
  API7: '0xa7-server-side-request-forgery',
  API8: '0xa8-security-misconfiguration',
  API9: '0xa9-improper-inventory-management',
  API10: '0xaa-unsafe-consumption-of-apis',
};

/**
 * Map an OWASP tag to its canonical page. Handles the Top 10 2021
 * (`A0X:2021`) and API Security 2023 (`APIX:2023`) editions, falling back to
 * the relevant edition index for any value not in the table.
 */
function owaspUrl(code: string): string {
  const [id, year] = code.split(':');
  if (year === '2021' && id && OWASP_2021[id]) {
    return `https://owasp.org/Top10/${OWASP_2021[id]}/`;
  }
  if (year === '2023' && id && OWASP_API_2023[id]) {
    return `https://owasp.org/API-Security/editions/2023/en/${OWASP_API_2023[id]}/`;
  }
  if (year === '2023') return 'https://owasp.org/API-Security/editions/2023/en/0x00-header/';
  return 'https://owasp.org/Top10/';
}

// ── Pretty rendering ───────────────────────────────────────────────────────

const FINDING_SEVERITY_COLOR: Record<SeverityName, (s: string) => string> = {
  CRITICAL: (s) => pc.bgRed(pc.white(s)),
  HIGH: pc.red,
  MEDIUM: pc.yellow,
  LOW: pc.cyan,
  INFO: pc.gray,
};

function renderPretty(rule: ExplainedRule): string {
  const lines: string[] = [];
  const sep = pc.dim('─'.repeat(70));
  const badge = FINDING_SEVERITY_COLOR[rule.findingSeverity](` ${rule.findingSeverity} `);

  lines.push(`${badge} ${pc.bold(rule.id)} ${pc.dim(`(${rule.oauthlintRuleId})`)}`);
  lines.push(sep);

  const field = (label: string, value: string): string => `${pc.dim(label.padEnd(16))}${value}`;

  lines.push(field('Severity', `${rule.findingSeverity} ${pc.dim(`(${rule.severity})`)}`));
  lines.push(
    field(
      'Category',
      rule.language ? `${rule.category} ${pc.dim(`(${rule.language})`)}` : rule.category,
    ),
  );
  if (rule.cwe) lines.push(field('CWE', `${rule.cwe} ${pc.dim('·')} ${pc.dim(rule.cweUrl ?? '')}`));
  if (rule.owasp) {
    lines.push(field('OWASP', `${rule.owasp} ${pc.dim('·')} ${pc.dim(rule.owaspUrl ?? '')}`));
  }
  lines.push(field('LLM-prevalence', llmBadge(rule.llmPrevalence)));
  lines.push('');

  lines.push(pc.bold('Why this matters / how to fix'));
  for (const line of rule.message.split('\n')) {
    lines.push(line.length > 0 ? `  ${line}` : '');
  }
  lines.push('');

  if (rule.examples.vulnerable) {
    lines.push(pc.red('✗ Vulnerable'));
    lines.push(...indentCode(rule.examples.vulnerable.code));
    lines.push('');
  }
  if (rule.examples.safe) {
    lines.push(pc.green('✓ Safe'));
    lines.push(...indentCode(rule.examples.safe.code));
    lines.push('');
  }

  if (rule.technology.length > 0) {
    lines.push(field('Technology', rule.technology.join(', ')));
  }
  lines.push(field('Docs', pc.cyan(rule.docUrl)));
  if (rule.references.length > 0) {
    lines.push(pc.dim('References'));
    for (const ref of rule.references) lines.push(pc.dim(`  · ${ref}`));
  }

  return `${lines.join('\n')}\n`;
}

function indentCode(code: string): string[] {
  return code.split('\n').map((line) => pc.dim('  │ ') + line);
}

function llmBadge(prevalence: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  if (prevalence === 'HIGH') return pc.magenta('HIGH');
  if (prevalence === 'MEDIUM') return pc.yellow('MEDIUM');
  return pc.dim('LOW');
}
