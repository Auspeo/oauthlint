// One-off: port the Cloud Design .dc.html pages into faithful Astro pages.
// Strips the canvas wrapper (<x-dc>/<helmet>/support.js), extracts the body
// verbatim into a raw HTML partial (rendered via set:html so code samples with
// `{ }` are untouched), and writes a thin Astro wrapper carrying the page meta.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = join(HERE, '..');
const SRC = join(SITE, '..', 'design', '_export');

// dc file -> { route, out: astro page path, partial name }
const PAGES = [
  { dc: 'Landing.dc.html', page: 'src/pages/index.astro', partial: 'index', depth: 1 },
  { dc: 'Docs.dc.html', page: 'src/pages/docs.astro', partial: 'docs', depth: 1 },
  { dc: 'Rules.dc.html', page: 'src/pages/rules.astro', partial: 'rules', depth: 1 },
  { dc: 'Rule.dc.html', page: 'src/pages/rules/sample.astro', partial: 'rule', depth: 2 },
  { dc: 'Pricing.dc.html', page: 'src/pages/pricing.astro', partial: 'pricing', depth: 1 },
  { dc: 'About.dc.html', page: 'src/pages/about.astro', partial: 'about', depth: 1 },
  { dc: '404.dc.html', page: 'src/pages/404.astro', partial: 'notfound', depth: 1 },
];

// canvas filename -> real route
const HREF_MAP = {
  'Landing.dc.html': '/',
  'Docs.dc.html': '/docs',
  'Rules.dc.html': '/rules',
  'Rule.dc.html': '/rules/sample',
  'Pricing.dc.html': '/pricing',
  'About.dc.html': '/about',
  '404.dc.html': '/404',
};

function extractMeta(helmet) {
  const title = (helmet.match(/<title>([\s\S]*?)<\/title>/) || [])[1]?.trim() || 'OAuthLint';
  const description =
    (helmet.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/) || [])[1]?.trim() || '';
  return { title, description };
}

function rewriteHrefs(html) {
  let out = html;
  // Replace the bare canvas filename wherever it's used as a link target,
  // preserving any trailing #fragment or ?query (e.g. About.dc.html#changelog).
  for (const [file, route] of Object.entries(HREF_MAP)) {
    out = out.split(file).join(route);
  }
  // assets live at site root
  out = out.replace(/(href|src)="favicon\.png"/g, '$1="/favicon.png"');
  out = out.replace(/(href|src)="og\.png"/g, '$1="/og.png"');
  return out;
}

function bodyInner(raw) {
  // content between </helmet> and </x-dc>
  const start = raw.indexOf('</helmet>');
  const end = raw.lastIndexOf('</x-dc>');
  if (start === -1 || end === -1) throw new Error('canvas markers not found');
  return raw.slice(start + '</helmet>'.length, end).trim();
}

function helmetBlock(raw) {
  const m = raw.match(/<helmet>([\s\S]*?)<\/helmet>/);
  return m ? m[1] : '';
}

mkdirSync(join(SITE, 'src', 'html'), { recursive: true });

for (const p of PAGES) {
  const raw = readFileSync(join(SRC, p.dc), 'utf8');
  const meta = extractMeta(helmetBlock(raw));
  const body = rewriteHrefs(bodyInner(raw));

  // raw HTML partial
  const partialPath = join(SITE, 'src', 'html', `${p.partial}.html`);
  writeFileSync(partialPath, `${body}\n`, 'utf8');

  // astro wrapper
  const up = '../'.repeat(p.depth);
  const esc = (s) => s.replace(/"/g, '&quot;');
  const astro = `---
import Base from '${up}layouts/Base.astro';
import body from '${up}html/${p.partial}.html?raw';
---
<Base title="${esc(meta.title)}" description="${esc(meta.description)}">
  <Fragment set:html={body} />
</Base>
`;
  const pagePath = join(SITE, p.page);
  mkdirSync(dirname(pagePath), { recursive: true });
  writeFileSync(pagePath, astro, 'utf8');
  console.log(`✓ ${p.dc} -> ${p.page}  (${(body.length / 1024).toFixed(1)} KB)`);
}
console.log('done.');
