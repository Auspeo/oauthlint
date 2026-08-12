#!/usr/bin/env node
/**
 * check-surfaces.mjs — release guardrail.
 *
 * Every user-facing surface (READMEs, marketplace manifests, the site, the docs)
 * must agree with each other and with reality on the things that constantly drift:
 *   1. the rule count ("N+ rules"),
 *   2. the coverage terms that must appear everywhere (e.g. "MCP"),
 *   3. the site announcement bar pointing at the CURRENT release, not a stale one,
 *   4. every language the pack ships being named on the coverage/docs surfaces,
 *   5. every pack language having a hosted per-language Semgrep bundle, and
 *   6. no em-dashes (an AI-writing tell) in rule messages or any user-facing prose.
 *
 * Checks 4-6 are derived from the pack itself, so adding a language pack forces the
 * docs, the coverage prose, and the bundles to keep up, and the humanized-prose rule
 * is enforced forever. Run before every release; it is also a CI job.
 *
 * The source of truth for the count is the rule pack itself (loadAllRules). Run
 * locally with `node scripts/check-surfaces.mjs` and in CI after `pnpm build`.
 * Exits non-zero (and lists exactly what is stale) on any drift, so a release can
 * never ship a surface that forgot the new feature or the new number.
 *
 * When a new coverage lands (PHP, Ruby, ...), add the term to MUST_MENTION and
 * every surface is forced to advertise it. The count auto-tracks the real pack.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAllRules } from '../rules/dist/loader.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// Surfaces that state a rounded "N+ rules" figure.
const COUNT_SURFACES = [
  'README.md',
  'cli/README.md',
  'vscode/README.md',
  'site/src/html/index.html',
];

// Surfaces whose coverage copy must advertise every current domain.
const COVERAGE_SURFACES = [
  'README.md',
  'cli/README.md',
  'vscode/README.md',
  'vscode/package.json',
  'rules/README.md',
  'action/README.md',
  'jetbrains/src/main/resources/META-INF/plugin.xml',
  'site/src/html/index.html',
  'site/src/layouts/Base.astro',
];

// Differentiating CAPABILITY terms that must appear on every surface above.
// Keep this to genuine differentiators (e.g. "MCP"), NOT individual languages:
// languages scale, so listing every one on every surface does not. Language
// completeness is enforced by check 4 against the two canonical TABLES instead,
// and prose elsewhere names a few relevant languages plus "and more".
const MUST_MENTION = ['MCP'];

const problems = [];
const passes = [];

// 1) Rule count: source of truth = the pack; surfaces state the floored-to-ten figure.
const loaded = await loadAllRules();
const realCount = loaded.length;
const expected = Math.floor(realCount / 10) * 10; // 192 -> 190
const seen = new Set();
for (const f of COUNT_SURFACES) {
  const m = read(f).match(/(\d{3})\+\s*(?:hand-curated\s+)?rules/i);
  if (!m) {
    problems.push(`${f}: no "N+ rules" figure found`);
    continue;
  }
  const n = Number(m[1]);
  seen.add(n);
  if (n === expected) passes.push(`${f}: ${n}+ rules`);
  else
    problems.push(
      `${f}: says ${n}+ rules, but the pack has ${realCount} (should say ${expected}+)`,
    );
}
if (seen.size > 1)
  problems.push(
    `Rule count disagrees across surfaces: ${[...seen].map((n) => `${n}+`).join(', ')}`,
  );

// 2) Coverage terms present everywhere.
for (const f of COVERAGE_SURFACES) {
  const body = read(f);
  for (const term of MUST_MENTION) {
    if (new RegExp(`\\b${term}\\b`, 'i').test(body)) passes.push(`${f}: mentions ${term}`);
    else problems.push(`${f}: does not mention "${term}"`);
  }
}

// 3) The site announcement bar must point at the CURRENT release, not a stale one.
//    (It advertises only the latest feature, so it moves every release — the check
//    is version-freshness, not a fixed coverage term.)
const cliVersion = JSON.parse(read('cli/package.json')).version; // e.g. 0.12.0
const expectedAnnounce = `v${cliVersion.split('.').slice(0, 2).join('.')}`; // v0.12
const annSrc = read('site/src/data/announcement.ts');
const annVer = annSrc.match(/version:\s*['"]([^'"]+)['"]/)?.[1];
if (!annVer) problems.push('site/src/data/announcement.ts: no announcement version found');
else if (annVer !== expectedAnnounce)
  problems.push(
    `site announcement bar is stale: says "${annVer}", but the current release is "${expectedAnnounce}" (CLI ${cliVersion})`,
  );
else passes.push(`announcement bar: ${annVer} (matches release)`);

// 4) Every language in the pack must appear in the two CANONICAL exhaustive lists:
//    the README "Language support" table and the docs per-language bundle table.
//    These are tables (one row per language), so listing every language scales.
//    Prose everywhere else names a few relevant languages plus "and more" and is
//    intentionally NOT checked for completeness. Source of truth = the languages
//    the rules actually declare, so a new pack forces the two tables to keep up.
const LANG_DISPLAY = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  go: 'Go',
  java: 'Java',
  rust: 'Rust',
  csharp: 'C#',
  php: 'PHP',
  ruby: 'Ruby',
  kotlin: 'Kotlin',
};
const packLangs = [...new Set(loaded.flatMap((x) => x.rule.languages))]
  .filter((l) => LANG_DISPLAY[l])
  .sort();
const LANGUAGE_SURFACES = ['README.md', 'site/src/pages/docs/semgrep.md'];
for (const f of LANGUAGE_SURFACES) {
  const body = read(f);
  for (const l of packLangs) {
    const name = LANG_DISPLAY[l];
    // `#` is not a word char, so C# needs a substring match; the rest use word boundaries.
    const present = name === 'C#' ? body.includes('C#') : new RegExp(`\\b${name}\\b`).test(body);
    if (present) passes.push(`${f}: lists ${name}`);
    else problems.push(`${f}: language list is missing "${name}" (the pack ships ${l} rules)`);
  }
}

// 5) Every language in the pack ships a hosted per-language Semgrep bundle.
//    (Catches a language added to the pack but forgotten in LANGUAGE_SUBSETS.)
for (const l of packLangs) {
  const bundle = `site/public/r/oauthlint-${l}.yaml`;
  if (existsSync(join(root, bundle))) passes.push(`bundle: oauthlint-${l}.yaml`);
  else
    problems.push(
      `no per-language bundle for ${l} (expected ${bundle}); add "${l}" to LANGUAGE_SUBSETS in site/scripts/build-semgrep-config.ts and rebuild the site`,
    );
}

// 6) No em-dashes (an AI-writing tell) in rule messages or user-facing prose. Keep the
//    product's voice human: use a period, colon, comma, or parentheses instead.
const walk = (dir, exts, out = []) => {
  for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(rel);
  }
  return out;
};
const proseFiles = [
  ...walk('rules/rules', ['.yml']),
  ...walk('site/src/pages', ['.md', '.astro']),
  'README.md',
  'cli/README.md',
  'rules/README.md',
  'vscode/README.md',
  'action/README.md',
  'mcp/README.md',
  'site/src/html/index.html',
  'site/src/layouts/Base.astro',
  // npm / marketplace manifests: their descriptions render on npmjs, the VS Code
  // and JetBrains marketplaces, and GitHub Marketplace, so they are prose too.
  'package.json',
  'cli/package.json',
  'rules/package.json',
  'vscode/package.json',
  'mcp/package.json',
  'action.yml',
  'action/action.yml',
  'jetbrains/src/main/resources/META-INF/plugin.xml',
];
let emdashHits = 0;
for (const f of proseFiles) {
  if (/—/.test(read(f))) {
    problems.push(`${f}: contains an em-dash; use a period, colon, comma, or parentheses instead`);
    emdashHits++;
  }
}
if (emdashHits === 0) passes.push(`no em-dashes across ${proseFiles.length} prose files`);

console.log(
  `Rule pack: ${realCount} rules (surfaces should read "${expected}+"). Coverage terms required everywhere: ${MUST_MENTION.join(', ')}.`,
);
if (problems.length === 0) {
  console.log(`\n✅ ${passes.length} checks passed — all surfaces are consistent.`);
  process.exit(0);
}
console.error(`\n❌ ${problems.length} surface problem(s) — fix before releasing:`);
for (const p of problems) console.error(`  - ${p}`);
process.exit(1);
