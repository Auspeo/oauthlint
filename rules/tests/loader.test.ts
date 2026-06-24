import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildManifest, loadAllRules } from '../src/loader.js';

describe('loadAllRules', () => {
  it('loads every shipped rule and validates the schema', async () => {
    const rules = await loadAllRules();
    expect(rules.length).toBeGreaterThanOrEqual(8);
  });

  it('returns rules sorted by id (deterministic order for snapshots)', async () => {
    const rules = await loadAllRules();
    const ids = rules.map((r) => r.rule.id);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  it('every rule has a fixtures directory (vulnerable + safe)', async () => {
    const rules = await loadAllRules();
    const fixturesRoot = new URL('./fixtures/', import.meta.url).pathname;
    for (const { rule } of rules) {
      const fixtureName = rule.id.replace(/^auth\./, '').replace(/\./g, '-');
      // Language packs ship same-language fixtures; JS/TS is the default.
      const ext = rule.languages.includes('python')
        ? 'py'
        : rule.languages.includes('go')
          ? 'go'
          : rule.languages.includes('java')
            ? 'java'
            : rule.languages.includes('rust')
              ? 'rs'
              : 'ts';
      const vuln = `${fixturesRoot}${fixtureName}/vulnerable.${ext}`;
      const safe = `${fixturesRoot}${fixtureName}/safe.${ext}`;
      expect(existsSync(vuln), `Missing vulnerable fixture for ${rule.id} at ${vuln}`).toBe(true);
      expect(existsSync(safe), `Missing safe fixture for ${rule.id} at ${safe}`).toBe(true);
    }
  });

  it('every rule has a non-empty message and a doc URL pointing to oauthlint.dev', async () => {
    const rules = await loadAllRules();
    for (const { rule } of rules) {
      expect(rule.message.length, `Empty message in ${rule.id}`).toBeGreaterThan(20);
      expect(rule.metadata['oauthlint-doc-url']).toMatch(/^https:\/\/oauthlint\.dev\/rules\//);
    }
  });

  it('rule ids and AUTH-ids are unique across the whole ruleset', async () => {
    const rules = await loadAllRules();
    const ruleIds = new Set<string>();
    const oauthlintIds = new Set<string>();
    for (const { rule } of rules) {
      expect(ruleIds.has(rule.id), `Duplicate rule id ${rule.id}`).toBe(false);
      ruleIds.add(rule.id);
      const aid = rule.metadata['oauthlint-rule-id'];
      expect(oauthlintIds.has(aid), `Duplicate oauthlint-rule-id ${aid}`).toBe(false);
      oauthlintIds.add(aid);
    }
  });
});

describe('buildManifest', () => {
  it('returns one manifest entry per rule', async () => {
    const rules = await loadAllRules();
    const manifest = await buildManifest();
    expect(manifest).toHaveLength(rules.length);
  });

  it('manifest entries expose the fields the CLI list command needs', async () => {
    const manifest = await buildManifest();
    const first = manifest[0];
    expect(first).toBeDefined();
    expect(first?.id).toMatch(/^auth\./);
    expect(first?.oauthlintId).toMatch(/^AUTH-/);
    expect(first?.llmPrevalence).toMatch(/^(HIGH|MEDIUM|LOW)$/);
    expect(first?.severity).toMatch(/^(INFO|WARNING|ERROR)$/);
  });
});
