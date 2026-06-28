import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SEVERITIES, type Severity, getRules, toDesignSeverity } from '../src/lib/rules';

const rules = getRules();

const catalogueSource = readFileSync(
  fileURLToPath(new URL('../src/pages/rules/index.astro', import.meta.url)),
  'utf8',
);

const owaspSource = readFileSync(
  fileURLToPath(new URL('../src/pages/owasp.astro', import.meta.url)),
  'utf8',
);

describe('getRules()', () => {
  it('loads the full rule pack', () => {
    expect(rules.length).toBeGreaterThan(80);
  });

  it('is cached (same array reference on repeat calls)', () => {
    expect(getRules()).toBe(rules);
  });

  it('gives every rule an id, severity, title and at least one language', () => {
    for (const r of rules) {
      expect(r.id, `${r.slug} id`).toMatch(/^auth\./);
      expect(r.ruleId, `${r.id} ruleId`).toMatch(/^AUTH-/);
      expect(r.title.length, `${r.id} title`).toBeGreaterThan(0);
      expect(SEVERITIES, `${r.id} severity`).toContain(r.severity);
      expect(r.languages.length, `${r.id} languages`).toBeGreaterThan(0);
      expect(r.category.length, `${r.id} category`).toBeGreaterThan(0);
    }
  });

  it('produces unique, url-safe slugs', () => {
    const slugs = rules.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug, slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('maps severity only onto the allowed design scale', () => {
    const allowed = new Set<Severity>(SEVERITIES);
    for (const r of rules) {
      expect(allowed.has(r.severity), `${r.id} -> ${r.severity}`).toBe(true);
    }
  });

  it('ships a vulnerable and a safe fixture for every rule', () => {
    for (const r of rules) {
      expect(r.vulnerable, `${r.id} vulnerable`).toBeDefined();
      expect(r.safe, `${r.id} safe`).toBeDefined();
      expect(r.vulnerable?.code.length, `${r.id} vulnerable code`).toBeGreaterThan(0);
      expect(r.safe?.code.length, `${r.id} safe code`).toBeGreaterThan(0);
    }
  });

  it('is sorted by id', () => {
    const ids = rules.map((r) => r.id);
    expect(ids).toEqual([...ids].sort((a, b) => a.localeCompare(b)));
  });
});

describe('rules catalogue pagination', () => {
  it('paginates at 12 rules per page', () => {
    expect(catalogueSource).toMatch(/PAGE_SIZE\s*=\s*12/);
  });

  it('renders the pager control markup', () => {
    expect(catalogueSource).toContain('id="rule-pager"');
    expect(catalogueSource).toContain('id="rule-prev"');
    expect(catalogueSource).toContain('id="rule-next"');
    expect(catalogueSource).toContain('id="rule-page-indicator"');
  });
});

describe('AI (LLM) prevalence', () => {
  it('tags every rule with a HIGH / MEDIUM / LOW prevalence', () => {
    for (const r of rules) {
      expect(['HIGH', 'MEDIUM', 'LOW'], `${r.id} llmPrevalence`).toContain(r.llmPrevalence);
    }
  });

  it('exposes the AI prevalence filter control + per-row signal on the catalogue', () => {
    expect(catalogueSource).toContain('id="rule-prevalence"');
    expect(catalogueSource).toContain('data-prev={r.llmPrevalence}');
    // The filter participates in the client-side match predicate.
    expect(catalogueSource).toContain('row.dataset.prev === prev');
  });

  it('only offers prevalence options that are actually present in the pack', () => {
    // presentPrevs is derived from the data, never frozen.
    expect(catalogueSource).toContain('presentPrevs');
  });
});

describe('dataflow (taint) surfacing', () => {
  // The taint rule ids the catalogue page derives (read-only, since
  // RuleView does not yet expose the analysis `mode`). Keep in sync with the
  // TAINT_RULE_IDS set in rules/index.astro and [slug].astro.
  const taintIds = [
    'auth.flow.open-redirect',
    'auth.flow.secret-in-response',
    'auth.flow.ssrf',
    'auth.go.flow.open-redirect',
    'auth.go.flow.secret-in-response',
    'auth.go.flow.ssrf',
    'auth.oauth.open-redirect-callback',
    'auth.py.flow.open-redirect',
    'auth.py.flow.secret-in-response',
    'auth.py.flow.ssrf',
  ];

  const detailSource = readFileSync(
    fileURLToPath(new URL('../src/pages/rules/[slug].astro', import.meta.url)),
    'utf8',
  );

  it('every derived taint id matches a real rule in the pack', () => {
    const ids = new Set(rules.map((r) => r.id));
    for (const id of taintIds) {
      expect(ids.has(id), `${id} present in pack`).toBe(true);
    }
  });

  it('both pages derive the same taint id set', () => {
    for (const id of taintIds) {
      expect(catalogueSource, `catalogue lists ${id}`).toContain(id);
      expect(detailSource, `detail lists ${id}`).toContain(id);
    }
  });

  it('exposes the dataflow filter control + per-row signal on the catalogue', () => {
    expect(catalogueSource).toContain('id="rule-flow"');
    expect(catalogueSource).toContain("data-flow={isTaint(r.id) ? 'true' : 'false'}");
    // The toggle participates in the client-side match predicate.
    expect(catalogueSource).toContain("row.dataset.flow === 'true'");
  });

  it('shows a DATAFLOW badge and explainer on the catalogue', () => {
    expect(catalogueSource).toContain('DATAFLOW');
    expect(catalogueSource).toContain('Dataflow analysis.');
    expect(catalogueSource).toContain('href="/research"');
  });

  it('marks taint rules as Dataflow analysis on the detail page', () => {
    expect(detailSource).toContain('DATAFLOW');
    expect(detailSource).toContain('Dataflow rule.');
    expect(detailSource).toContain("isTaint ? 'Dataflow' : 'Pattern'");
  });
});

describe('OWASP coverage page', () => {
  it('every shipped owasp code resolves to a known edition (api-2023 / web-2021)', () => {
    const codes = [...new Set(rules.map((r) => r.owasp).filter(Boolean) as string[])];
    expect(codes.length).toBeGreaterThan(0);
    for (const code of codes) {
      expect(/:(2023|2021)$/.test(code), `${code} edition`).toBe(true);
    }
  });

  it('derives coverage from getRules() rather than hardcoding a category list', () => {
    expect(owaspSource).toContain('getRules()');
    expect(owaspSource).toContain('rule.owasp');
    // No frozen "covers N categories" count in the copy.
    expect(owaspSource).toContain('{categoryCount}');
  });

  it('links the catalogue to the OWASP coverage page', () => {
    expect(catalogueSource).toContain('href="/owasp"');
  });
});

describe('toDesignSeverity()', () => {
  it('maps Semgrep severities onto the design scale', () => {
    expect(toDesignSeverity('ERROR')).toBe('high');
    expect(toDesignSeverity('WARNING')).toBe('medium');
    expect(toDesignSeverity('INFO')).toBe('low');
    expect(toDesignSeverity('CRITICAL')).toBe('critical');
    expect(toDesignSeverity('something-else')).toBe('info');
  });
});
