#!/usr/bin/env node
/**
 * Generate `docs/rules/<rule-id>.md` from the live rule pack + fixtures.
 *
 * Keeps the documentation in sync with the code: each page is a slim
 * Markdown rendering of the rule's metadata, message body, and the
 * vulnerable + safe fixture pair that ships with it.
 *
 * Run via: pnpm docs:rules
 */
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type LoadedRule, loadAllRules } from 'oauthlint-rules';

// Layout (after the upcoming OAuthLint/oauthlint repo split):
//   <repo-root>/
//     scripts/generate-rule-docs.ts   ← this file
//     rules/tests/fixtures/...        ← rule fixtures we render
//     docs/rules/...                  ← generated output
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = join(ROOT, 'docs', 'rules');
const FIXTURES_DIR = join(ROOT, 'rules', 'tests', 'fixtures');

interface Snippet {
  // Markdown fence language id.
  language: 'ts' | 'js' | 'python' | 'go' | 'java' | 'rust';
  content: string;
}

// File extension -> markdown fence id.
const EXT_FENCE: Record<string, Snippet['language']> = {
  ts: 'ts',
  js: 'js',
  py: 'python',
  go: 'go',
  java: 'java',
  rs: 'rust',
};

async function readFixturePair(ruleId: string): Promise<{
  vulnerable?: Snippet;
  safe?: Snippet;
}> {
  const dir = ruleId.replace(/^auth\./, '').replace(/\./g, '-');
  const out: { vulnerable?: Snippet; safe?: Snippet } = {};
  for (const kind of ['vulnerable', 'safe'] as const) {
    for (const ext of ['ts', 'js', 'py', 'go', 'java', 'rs'] as const) {
      const file = join(FIXTURES_DIR, dir, `${kind}.${ext}`);
      try {
        const content = await readFile(file, 'utf8');
        out[kind] = { language: EXT_FENCE[ext], content: content.trim() };
        break;
      } catch {
        /* try next */
      }
    }
  }
  return out;
}

function renderRulePage(
  loaded: LoadedRule,
  snippets: {
    vulnerable?: Snippet;
    safe?: Snippet;
  },
): string {
  const { rule } = loaded;
  const m = rule.metadata;
  const sections: string[] = [];

  sections.push(`# \`${rule.id}\``);
  sections.push('');
  sections.push(`> ${rule.message.split('\n')[0]?.trim() ?? 'OAuthLint rule.'}`);
  sections.push('');

  sections.push('| | |');
  sections.push('|---|---|');
  sections.push(`| **OAuthLint id** | \`${m['oauthlint-rule-id']}\` |`);
  sections.push(`| **Severity** | ${rule.severity} |`);
  sections.push(`| **LLM prevalence** | ${m['llm-prevalence']} |`);
  if (m.cwe)
    sections.push(
      `| **CWE** | [${m.cwe}](https://cwe.mitre.org/data/definitions/${m.cwe.replace('CWE-', '')}.html) |`,
    );
  if (m.owasp) sections.push(`| **OWASP** | ${m.owasp} |`);
  sections.push(`| **Languages** | ${rule.languages.join(', ')} |`);
  if (m.technology?.length) {
    sections.push(`| **Technologies** | ${m.technology.join(', ')} |`);
  }
  sections.push('');

  sections.push('## Why this matters');
  sections.push('');
  sections.push(rule.message.trim());
  sections.push('');

  if (snippets.vulnerable) {
    sections.push('## ❌ Vulnerable');
    sections.push('');
    sections.push(`\`\`\`${snippets.vulnerable.language}`);
    sections.push(snippets.vulnerable.content);
    sections.push('```');
    sections.push('');
  }

  if (snippets.safe) {
    sections.push('## ✅ Safe');
    sections.push('');
    sections.push(`\`\`\`${snippets.safe.language}`);
    sections.push(snippets.safe.content);
    sections.push('```');
    sections.push('');
  }

  const isPython = rule.languages.includes('python');
  sections.push('## Suppressing this rule (when you really must)');
  sections.push('');
  sections.push(isPython ? '```python' : '```ts');
  sections.push(`${isPython ? '#' : '//'} oauthlint-disable-next-line ${rule.id} -- <reason>`);
  sections.push(
    isPython
      ? 'this_line_would_otherwise_trigger_the_rule()'
      : 'thisLineWouldOtherwiseTriggerTheRule();',
  );
  sections.push('```');
  sections.push('');
  sections.push(
    'Disable directives are line-scoped by design — wholesale silencing of a rule across the codebase is intentionally not supported, because the next reviewer needs to see exactly which lines opted out.',
  );
  sections.push('');

  if (m.references?.length) {
    sections.push('## References');
    sections.push('');
    for (const ref of m.references) {
      sections.push(`- ${ref}`);
    }
    sections.push('');
  }

  sections.push(
    '<!-- Generated from rules/rules/ + the fixture pair. Edit those, not this file — re-run `pnpm docs:rules` to refresh. -->',
  );
  sections.push('');

  return sections.join('\n');
}

async function ensureDir(p: string): Promise<void> {
  try {
    await stat(p);
  } catch {
    await mkdir(p, { recursive: true });
  }
}

async function writeIndex(rules: LoadedRule[]): Promise<void> {
  const byCategory = new Map<string, LoadedRule[]>();
  for (const r of rules) {
    // auth.jwt.alg-none -> 'jwt'; auth.py.jwt.no-verify -> 'py-jwt' (language pack).
    const parts = r.rule.id.split('.');
    const cat = (parts.length >= 4 ? `${parts[1]}-${parts[2]}` : parts[1]) ?? 'misc';
    let bucket = byCategory.get(cat);
    if (!bucket) {
      bucket = [];
      byCategory.set(cat, bucket);
    }
    bucket.push(r);
  }

  const lines: string[] = [];
  lines.push('# OAuthLint rule catalogue');
  lines.push('');
  lines.push(`${rules.length} rules grouped by category.`);
  lines.push('');
  lines.push(
    '<!-- Generated from rules/rules/ + the matching fixtures — keep the YAML/fixtures authoritative. -->',
  );
  lines.push('');
  for (const cat of [...byCategory.keys()].sort()) {
    const bucket = byCategory.get(cat) ?? [];
    lines.push(`## ${cat.toUpperCase()}`);
    lines.push('');
    lines.push('| Rule | Severity | LLM | CWE | OWASP |');
    lines.push('|------|----------|-----|-----|-------|');
    for (const { rule } of bucket.sort((a, b) => a.rule.id.localeCompare(b.rule.id))) {
      const m = rule.metadata;
      const slug = rule.id.replace(/^auth\./, '').replace(/\./g, '-');
      lines.push(
        `| [\`${rule.id}\`](./${slug}.md) | ${rule.severity} | ${m['llm-prevalence']} | ${m.cwe ?? '—'} | ${m.owasp ?? '—'} |`,
      );
    }
    lines.push('');
  }
  await writeFile(join(DOCS_DIR, 'index.md'), lines.join('\n'), 'utf8');
}

async function main(): Promise<void> {
  const rules = await loadAllRules();
  await ensureDir(DOCS_DIR);

  for (const loaded of rules) {
    const snippets = await readFixturePair(loaded.rule.id);
    const md = renderRulePage(loaded, snippets);
    const slug = loaded.rule.id.replace(/^auth\./, '').replace(/\./g, '-');
    await writeFile(join(DOCS_DIR, `${slug}.md`), md, 'utf8');
  }
  await writeIndex(rules);

  // Sanity check: every page we just wrote exists.
  const written = (await readdir(DOCS_DIR)).filter((f) => f.endsWith('.md'));
  console.log(`✓ Generated ${written.length} files in docs/rules/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
