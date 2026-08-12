#!/usr/bin/env node
/**
 * check-surfaces.mjs — release guardrail.
 *
 * Every user-facing surface (READMEs, marketplace manifests, the site hero) must
 * agree with each other and with reality on three things that constantly drift:
 *   1. the rule count ("N+ rules"),
 *   2. the coverage terms that must appear everywhere (e.g. "MCP"), and
 *   3. the site announcement bar pointing at the CURRENT release, not a stale one.
 *
 * The source of truth for the count is the rule pack itself (loadAllRules). Run
 * locally with `node scripts/check-surfaces.mjs` and in CI after `pnpm build`.
 * Exits non-zero (and lists exactly what is stale) on any drift, so a release can
 * never ship a surface that forgot the new feature or the new number.
 *
 * When a new coverage lands (PHP, Ruby, ...), add the term to MUST_MENTION and
 * every surface is forced to advertise it. The count auto-tracks the real pack.
 */
import { readFileSync } from 'node:fs';
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

// Coverage terms that must appear on every surface above. Extend on each new pack.
const MUST_MENTION = ['MCP', 'PHP', 'Ruby', 'Kotlin'];

const problems = [];
const passes = [];

// 1) Rule count: source of truth = the pack; surfaces state the floored-to-ten figure.
const realCount = (await loadAllRules()).length;
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
