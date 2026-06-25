import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SEVERITIES, type Severity, getRules, toDesignSeverity } from '../src/lib/rules';

const rules = getRules();

const catalogueSource = readFileSync(
  fileURLToPath(new URL('../src/pages/rules/index.astro', import.meta.url)),
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

describe('toDesignSeverity()', () => {
  it('maps Semgrep severities onto the design scale', () => {
    expect(toDesignSeverity('ERROR')).toBe('high');
    expect(toDesignSeverity('WARNING')).toBe('medium');
    expect(toDesignSeverity('INFO')).toBe('low');
    expect(toDesignSeverity('CRITICAL')).toBe('critical');
    expect(toDesignSeverity('something-else')).toBe('info');
  });
});
