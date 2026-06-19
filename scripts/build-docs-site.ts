#!/usr/bin/env node
/**
 * Build the static docs site served at https://oauthlint.dev.
 *
 * It renders the generated rule docs (`docs/rules/*.md`) into clean-URL HTML
 * pages so the URLs printed in every finding — `oauthlint.dev/rules/<id>` —
 * resolve to a real page:
 *
 *   site/index.html               → landing page
 *   site/rules/index.html         → rule catalogue (from docs/rules/README.md)
 *   site/rules/<id>/index.html    → one page per rule (clean URL)
 *
 * Output is a plain static folder deployable to any host (Cloudflare Pages,
 * GitHub Pages, Netlify). Run via: pnpm docs:site
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = join(ROOT, 'docs', 'rules');
const OUT_DIR = join(ROOT, 'site');

marked.setOptions({ gfm: true });

const CSS = `
:root { color-scheme: light dark; --fg:#1a1a2e; --muted:#5a5a72; --bg:#fff; --code:#f4f4f8; --border:#e6e6ef; --accent:#5b3df5; }
@media (prefers-color-scheme: dark) { :root { --fg:#e8e8f0; --muted:#9a9ab0; --bg:#0f0f1a; --code:#1a1a2e; --border:#2a2a3e; --accent:#9d8cff; } }
* { box-sizing: border-box; }
body { font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--fg); background: var(--bg); margin: 0; }
.wrap { max-width: 820px; margin: 0 auto; padding: 2rem 1.25rem 5rem; }
header.site { border-bottom: 1px solid var(--border); }
header.site .wrap { padding: 1rem 1.25rem; display: flex; gap: 1.25rem; align-items: baseline; }
header.site a { color: var(--fg); text-decoration: none; font-weight: 600; }
header.site nav a { color: var(--muted); font-weight: 500; margin-left: 1rem; }
a { color: var(--accent); }
h1 { font-size: 2rem; line-height: 1.2; margin: 0.5rem 0 1rem; }
h2 { margin-top: 2.2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.3rem; }
blockquote { margin: 1rem 0; padding: 0.5rem 1rem; border-left: 3px solid var(--accent); color: var(--muted); }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: 0.94rem; }
th, td { border: 1px solid var(--border); padding: 0.45rem 0.7rem; text-align: left; }
th { background: var(--code); }
code { background: var(--code); padding: 0.12em 0.4em; border-radius: 4px; font-size: 0.88em; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
pre { background: var(--code); border: 1px solid var(--border); border-radius: 8px; padding: 1rem; overflow-x: auto; }
pre code { background: none; padding: 0; font-size: 0.85rem; }
footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.9rem; }
.tagline { color: var(--muted); font-size: 1.15rem; }
`;

function page(title: string, bodyHtml: string, depth: number): string {
  const root = '../'.repeat(depth) || './';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="oauthlint — catch the OAuth/OIDC/JWT anti-patterns AI coding tools produce.">
<style>${CSS}</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a href="${root}">oauthlint</a>
  <nav><a href="${root}rules/">Rules</a><a href="https://github.com/Auspeo/oauthlint">GitHub</a></nav>
</div></header>
<main class="wrap">
${bodyHtml}
<footer>oauthlint — an <a href="https://github.com/Auspeo">Auspeo</a> project · MIT licensed · <a href="https://github.com/Auspeo/oauthlint">source</a></footer>
</main>
</body>
</html>
`;
}

/** Rewrite catalogue links like `(./cookie-no-secure.md)` → `(/rules/cookie-no-secure/)`. */
function cleanLinks(md: string): string {
  return md.replace(/\]\(\.\/([a-z0-9-]+)\.md\)/g, '](/rules/$1/)');
}

async function build() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(join(OUT_DIR, 'rules'), { recursive: true });

  const entries = (await readdir(DOCS_DIR)).filter((f) => f.endsWith('.md'));
  const ruleFiles = entries.filter((f) => f !== 'README.md').sort();

  // Per-rule pages (clean URLs: /rules/<slug>/).
  for (const file of ruleFiles) {
    const slug = file.replace(/\.md$/, '');
    const md = cleanLinks(await readFile(join(DOCS_DIR, file), 'utf8'));
    const html = await marked.parse(md);
    await mkdir(join(OUT_DIR, 'rules', slug), { recursive: true });
    await writeFile(
      join(OUT_DIR, 'rules', slug, 'index.html'),
      page(`${slug} · oauthlint rules`, html, 2),
    );
  }

  // Rule catalogue index from docs/rules/README.md.
  const indexMd = cleanLinks(await readFile(join(DOCS_DIR, 'README.md'), 'utf8'));
  await writeFile(
    join(OUT_DIR, 'rules', 'index.html'),
    page('Rule catalogue · oauthlint', await marked.parse(indexMd), 1),
  );

  // Landing page.
  const landing = `
<h1>oauthlint</h1>
<p class="tagline">Catch the OAuth / OIDC / JWT anti-patterns AI coding tools systematically produce.</p>
<pre><code>npx oauthlint scan ./src</code></pre>
<p>${ruleFiles.length} Semgrep rules · CLI + GitHub Action + VS Code extension · MIT licensed.</p>
<p><a href="/rules/">Browse the ${ruleFiles.length} rules →</a></p>
<h2>What it is</h2>
<p>LLM coding assistants ship the same OAuth/JWT bugs across every project they touch — <code>alg: none</code>,
hard-coded <code>client_secret</code>, tokens in <code>localStorage</code>, OAuth flows without <code>state</code> or PKCE.
oauthlint flags them before they merge: free, focused, developer-first.</p>
<p>Get started on <a href="https://github.com/Auspeo/oauthlint">GitHub</a>.</p>
`;
  await writeFile(join(OUT_DIR, 'index.html'), page('oauthlint', landing, 0));

  console.log(`✓ Built ${ruleFiles.length + 2} pages in site/`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
