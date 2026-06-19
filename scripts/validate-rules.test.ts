import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

const TARGETS_PATH = new URL('./validation-targets.yml', import.meta.url).pathname;

interface Target {
  repo: string;
  ref?: string;
  expectedSignal: 'low' | 'high';
  notes?: string;
}

interface TargetsFile {
  version: number;
  targets: Target[];
}

describe('validation-targets.yml', () => {
  it('is valid YAML with the expected envelope', async () => {
    const yml = parseYaml(await readFile(TARGETS_PATH, 'utf8')) as TargetsFile;
    expect(yml.version).toBe(1);
    expect(Array.isArray(yml.targets)).toBe(true);
    expect(yml.targets.length).toBeGreaterThanOrEqual(5);
  });

  it('every target has a repo, an expectedSignal, and either notes or a clear ref', async () => {
    const yml = parseYaml(await readFile(TARGETS_PATH, 'utf8')) as TargetsFile;
    for (const t of yml.targets) {
      expect(t.repo, `target missing repo: ${JSON.stringify(t)}`).toMatch(/^[\w.-]+\/[\w.-]+$/);
      expect(t.expectedSignal, `target ${t.repo} missing expectedSignal`).toMatch(/^(low|high)$/);
    }
  });

  it('repo identifiers are unique (no accidental duplicates)', async () => {
    const yml = parseYaml(await readFile(TARGETS_PATH, 'utf8')) as TargetsFile;
    const seen = new Set<string>();
    for (const t of yml.targets) {
      expect(seen.has(t.repo), `duplicate target ${t.repo}`).toBe(false);
      seen.add(t.repo);
    }
  });

  it('mix of low + high signal targets (signal vs noise should be measurable)', async () => {
    const yml = parseYaml(await readFile(TARGETS_PATH, 'utf8')) as TargetsFile;
    const low = yml.targets.filter((t) => t.expectedSignal === 'low').length;
    const high = yml.targets.filter((t) => t.expectedSignal === 'high').length;
    expect(
      low,
      'need at least 2 low-signal targets to measure false positives',
    ).toBeGreaterThanOrEqual(2);
    expect(high, 'need at least 2 high-signal targets to measure recall').toBeGreaterThanOrEqual(2);
  });
});
