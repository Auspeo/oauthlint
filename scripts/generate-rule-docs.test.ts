import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { loadAllRules } from 'oauthlint-rules';
import { describe, expect, it } from 'vitest';

const DOCS_DIR = new URL('../docs/rules/', import.meta.url).pathname;

describe('generated rule documentation', () => {
  it('has one .md per shipped rule + an index', async () => {
    const rules = await loadAllRules();
    const files = (await readdir(DOCS_DIR)).filter((f) => f.endsWith('.md')).sort();
    // +1 for index.md (the catalogue)
    expect(files.length).toBe(rules.length + 1);
    expect(files).toContain('index.md');
  });

  it('every page references its canonical rule id and includes both fixtures', async () => {
    const rules = await loadAllRules();
    for (const { rule } of rules) {
      const slug = rule.id.replace(/^auth\./, '').replace(/\./g, '-');
      const md = await readFile(join(DOCS_DIR, `${slug}.md`), 'utf8');
      expect(md, `${slug}.md`).toContain(`\`${rule.id}\``);
      expect(md, `${slug}.md missing vulnerable section`).toContain('## ❌ Vulnerable');
      expect(md, `${slug}.md missing safe section`).toContain('## ✅ Safe');
      expect(md, `${slug}.md missing severity row`).toContain(rule.severity);
    }
  });

  it('index lists every rule with a working internal link', async () => {
    const rules = await loadAllRules();
    const index = await readFile(join(DOCS_DIR, 'index.md'), 'utf8');
    for (const { rule } of rules) {
      const slug = rule.id.replace(/^auth\./, '').replace(/\./g, '-');
      expect(index, `index missing link to ${slug}.md`).toContain(`(./${slug}.md)`);
    }
  });
});
