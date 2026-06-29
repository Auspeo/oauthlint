import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

// Guards the generated install-free Semgrep bundles in site/public/r/, written
// by scripts/build-semgrep-config.ts during the site `prebuild`. These are the
// artifacts served at https://oauthlint.dev/r/*.yaml, so a broken or empty
// bundle is a shipped-to-users regression. Run `pnpm build` (or the site
// prebuild) before this test so the files exist.
const R_DIR = new URL('../public/r/', import.meta.url);
const read = (name: string) => readFileSync(fileURLToPath(new URL(name, R_DIR)), 'utf8');

/** Per-language subsets emitted alongside the combined pack. Mirrors the generator. */
const LANGUAGE_SUBSETS = ['javascript', 'typescript', 'python', 'go', 'java', 'rust'] as const;

describe('generated Semgrep bundle', () => {
  it('oauthlint.yaml is valid YAML with a top-level rules: array', () => {
    const doc = parseYaml(read('oauthlint.yaml'));
    expect(doc).toBeTypeOf('object');
    expect(Array.isArray(doc.rules)).toBe(true);
  });

  it('ships the full rule pack (>= 130 rules)', () => {
    const doc = parseYaml(read('oauthlint.yaml'));
    expect(doc.rules.length).toBeGreaterThanOrEqual(130);
  });

  it.each(LANGUAGE_SUBSETS)('emits a non-empty %s subset with a rules: array', (lang) => {
    const file = fileURLToPath(new URL(`oauthlint-${lang}.yaml`, R_DIR));
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBeGreaterThan(0);

    const doc = parseYaml(read(`oauthlint-${lang}.yaml`));
    expect(Array.isArray(doc.rules)).toBe(true);
    expect(doc.rules.length).toBeGreaterThan(0);
  });
});
