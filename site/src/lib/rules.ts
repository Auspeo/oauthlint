/**
 * Build-time loader for the OAuthLint rule pack.
 *
 * Parses every Semgrep rule YAML under `rules/rules/**` (in the monorepo
 * root, a sibling of the `site/` package) plus its vulnerable/safe fixture
 * pair under `rules/tests/fixtures/<slug>/`, and exposes a typed, design-ready
 * view of each rule for the catalogue and per-rule pages.
 *
 * Parses the rule pack with the `oauthlint-rules` loader's conventions: the
 * `yaml` package, the fixture directory convention
 * (`auth.<...>.<name>` -> `<...>-<name>`), and the same metadata keys.
 *
 * No new dependencies: Node `fs` + the workspace `yaml` package only.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

// site/src/lib/rules.ts -> repo root is four levels up.
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..', '..');
const RULES_DIR = join(REPO_ROOT, 'rules', 'rules');
const FIXTURES_DIR = join(REPO_ROOT, 'rules', 'tests', 'fixtures');

/** Design severity scale (see tokens.css `--ol-sev-*`). */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export const SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

/** Fixture language id -> a short label + the code-block fence language. */
export type FixtureLang = 'ts' | 'js' | 'python' | 'go' | 'java' | 'rust';

export interface Fixture {
  /** Raw fixture source code. */
  code: string;
  /** Fence/highlight language. */
  language: FixtureLang;
  /** Original file name (e.g. `vulnerable.ts`) for the code-block header. */
  filename: string;
}

export interface RuleView {
  /** Full Semgrep id, e.g. `auth.jwt.alg-none`. */
  id: string;
  /** OAuthLint id, e.g. `AUTH-JWT-001`. */
  ruleId: string;
  /** Human title derived from the first line of the message. */
  title: string;
  /** Design severity. */
  severity: Severity;
  /** Category bucket, e.g. `jwt`, `py-jwt`. */
  category: string;
  /** Semgrep languages, normalised (e.g. `ts`, `python`, `go`). */
  languages: string[];
  /** Full rule message (the "what / why" body). */
  message: string;
  /** CWE id, e.g. `CWE-327`. */
  cwe?: string;
  /** OWASP reference, e.g. `API2:2023`. */
  owasp?: string;
  /** LLM prevalence tag. */
  llmPrevalence: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Canonical published doc url. */
  docUrl: string;
  /** Reference links. */
  references: string[];
  /** Stable, unique URL slug (matches the fixture directory name). */
  slug: string;
  vulnerable?: Fixture;
  safe?: Fixture;
}

// File extension -> fixture language id.
const EXT_LANG: Record<string, FixtureLang> = {
  ts: 'ts',
  js: 'js',
  py: 'python',
  go: 'go',
  java: 'java',
  rs: 'rust',
};
const FIXTURE_EXTS = Object.keys(EXT_LANG);

// Display-friendly language labels for chips/badges.
const LANG_LABEL: Record<string, string> = {
  javascript: 'js',
  typescript: 'ts',
  python: 'python',
  go: 'go',
  java: 'java',
  rust: 'rust',
};

/** Map a Semgrep / OAuthLint severity onto the design severity scale. */
export function toDesignSeverity(raw: string): Severity {
  switch (raw.toUpperCase()) {
    // Allow rules to override via design names directly, too.
    case 'CRITICAL':
      return 'critical';
    case 'ERROR':
    case 'HIGH':
      return 'high';
    case 'WARNING':
    case 'MEDIUM':
      return 'medium';
    case 'INFO':
    case 'LOW':
      return 'low';
    default:
      return 'info';
  }
}

/** `auth.jwt.alg-none` -> `jwt-alg-none`; matches the fixture dir convention. */
function slugFromId(id: string): string {
  return id.replace(/^auth\./, '').replace(/\./g, '-');
}

/** `auth.jwt.alg-none` -> `jwt`; `auth.py.jwt.no-verify` -> `py-jwt`. */
function categoryFromId(id: string): string {
  const parts = id.split('.');
  // auth.<cat>.<name> => parts = [auth, cat, name]
  // auth.<lang>.<cat>.<name> => parts = [auth, lang, cat, name]
  if (parts.length >= 4) return `${parts[1]}-${parts[2]}`;
  return parts[1] ?? 'misc';
}

function titleFromMessage(message: string): string {
  const first = message.split('\n').find((l) => l.trim().length > 0) ?? '';
  return first.trim();
}

function readFixture(slug: string, kind: 'vulnerable' | 'safe'): Fixture | undefined {
  const dir = join(FIXTURES_DIR, slug);
  for (const ext of FIXTURE_EXTS) {
    const filename = `${kind}.${ext}`;
    try {
      const code = readFileSync(join(dir, filename), 'utf8').trim();
      return { code, language: EXT_LANG[ext], filename };
    } catch {
      // try next extension
    }
  }
  return undefined;
}

interface RawMetadata {
  'oauthlint-rule-id': string;
  'oauthlint-doc-url': string;
  cwe?: string;
  owasp?: string;
  'llm-prevalence': 'HIGH' | 'MEDIUM' | 'LOW';
  references?: string[];
  severity?: string;
}

interface RawRule {
  id: string;
  languages: string[];
  severity: string;
  message: string;
  metadata: RawMetadata;
}

function* walkYaml(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkYaml(full);
    } else if (entry.name.endsWith('.yml') || entry.name.endsWith('.yaml')) {
      yield full;
    }
  }
}

let cache: RuleView[] | undefined;

/**
 * Load + parse every shipped rule, sorted by id. Cached per process so the
 * Astro build only walks the rule pack once.
 */
export function getRules(): RuleView[] {
  if (cache) return cache;

  const views: RuleView[] = [];
  const seenSlugs = new Set<string>();

  for (const file of walkYaml(RULES_DIR)) {
    const parsed = parseYaml(readFileSync(file, 'utf8')) as { rules?: RawRule[] };
    for (const rule of parsed.rules ?? []) {
      const slug = slugFromId(rule.id);
      if (seenSlugs.has(slug)) {
        throw new Error(`Duplicate rule slug "${slug}" (from ${rule.id} in ${file})`);
      }
      seenSlugs.add(slug);

      const m = rule.metadata;
      views.push({
        id: rule.id,
        ruleId: m['oauthlint-rule-id'],
        title: titleFromMessage(rule.message),
        // Rules may carry a design severity override in metadata.severity;
        // otherwise map the Semgrep level.
        severity: toDesignSeverity(m.severity ?? rule.severity),
        category: categoryFromId(rule.id),
        languages: rule.languages.map((l) => LANG_LABEL[l] ?? l),
        message: rule.message.trim(),
        cwe: m.cwe,
        owasp: m.owasp,
        llmPrevalence: m['llm-prevalence'],
        docUrl: m['oauthlint-doc-url'],
        references: m.references ?? [],
        slug,
        vulnerable: readFixture(slug, 'vulnerable'),
        safe: readFixture(slug, 'safe'),
      });
    }
  }

  views.sort((a, b) => a.id.localeCompare(b.id));
  cache = views;
  return views;
}
