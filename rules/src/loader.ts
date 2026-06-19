import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fastGlob from 'fast-glob';
import { parse as parseYaml } from 'yaml';
import { type Rule, RuleFileSchema } from './schema.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Root directory containing the bundled rule YAML files.
 * When the package is published, the rules/ folder ships next to dist/.
 * In development, we walk up to the package root.
 */
export const RULES_ROOT = resolve(HERE, '..', 'rules');

export interface LoadedRule {
  rule: Rule;
  sourceFile: string;
}

/**
 * Recursively load every rule shipped with this package.
 * Throws a descriptive error if any rule fails schema validation —
 * we'd rather fail loud at import time than silently ship a broken rule.
 */
export async function loadAllRules(root: string = RULES_ROOT): Promise<LoadedRule[]> {
  const files = await fastGlob(['**/*.yml', '**/*.yaml'], {
    cwd: root,
    absolute: true,
    ignore: ['**/node_modules/**'],
  });

  const loaded: LoadedRule[] = [];
  const seenIds = new Set<string>();

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    let parsed: unknown;
    try {
      parsed = parseYaml(content);
    } catch (err) {
      throw new Error(`Invalid YAML in ${file}: ${(err as Error).message}`);
    }

    const result = RuleFileSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Schema validation failed for ${file}:\n${result.error.issues
          .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
          .join('\n')}`,
      );
    }

    for (const rule of result.data.rules) {
      if (seenIds.has(rule.id)) {
        throw new Error(`Duplicate rule id ${rule.id} (also found in ${file})`);
      }
      seenIds.add(rule.id);
      loaded.push({ rule, sourceFile: file });
    }
  }

  loaded.sort((a, b) => a.rule.id.localeCompare(b.rule.id));
  return loaded;
}

/**
 * Build a manifest summarising every shipped rule.
 * Useful for the CLI's `oauthlint list` command and for the docs site.
 */
export async function buildManifest(root: string = RULES_ROOT) {
  const loaded = await loadAllRules(root);
  return loaded.map(({ rule, sourceFile }) => ({
    id: rule.id,
    severity: rule.severity,
    languages: rule.languages,
    oauthlintId: rule.metadata['oauthlint-rule-id'],
    docUrl: rule.metadata['oauthlint-doc-url'],
    llmPrevalence: rule.metadata['llm-prevalence'],
    cwe: rule.metadata.cwe,
    owasp: rule.metadata.owasp,
    description: rule.message.split('\n')[0]?.trim() ?? '',
    sourceFile,
  }));
}

export type RuleManifestEntry = Awaited<ReturnType<typeof buildManifest>>[number];
