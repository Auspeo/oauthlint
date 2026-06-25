import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';

const rulesDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'rules');

const CATEGORY_LABELS: Record<string, string> = {
  cookie: 'Cookies',
  cors: 'CORS',
  flow: 'Auth flow',
  jwt: 'JWT',
  oauth: 'OAuth 2.0',
  secret: 'Secrets',
  session: 'Sessions',
};

/** Build the /rules/ sidebar from the generated rule docs, grouped by category. */
function ruleSidebar() {
  const files = readdirSync(rulesDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'index.md')
    .sort();
  const groups: Record<string, { text: string; link: string }[]> = {};
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const category = slug.split('-')[0];
    const firstLine = readFileSync(join(rulesDir, file), 'utf8').split('\n')[0];
    const text = firstLine.replace(/^#\s*/, '').replace(/`/g, '').trim() || slug;
    groups[category] = groups[category] ?? [];
    groups[category].push({ text, link: `/rules/${slug}` });
  }
  return Object.keys(groups)
    .sort()
    .map((category) => ({
      text: CATEGORY_LABELS[category] ?? category.toUpperCase(),
      collapsed: false,
      items: groups[category],
    }));
}

export default defineConfig({
  title: 'oauthlint',
  description:
    'A free Semgrep linter for the OAuth, OIDC and JWT anti-patterns that AI coding tools systematically ship.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: 'https://oauthlint.dev' },
  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'theme-color', content: '#2f6feb' }],
    ['meta', { property: 'og:title', content: 'oauthlint' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Catch the OAuth/OIDC/JWT bugs AI coding tools write — before they merge.',
      },
    ],
    ['meta', { property: 'og:url', content: 'https://oauthlint.dev' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:image', content: 'https://oauthlint.dev/og.png' }],
    ['meta', { property: 'og:image:width', content: '2560' }],
    ['meta', { property: 'og:image:height', content: '1280' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:image', content: 'https://oauthlint.dev/og.png' }],
  ],
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: 'Guide', link: '/getting-started' },
      { text: 'Rules', link: '/rules/' },
      { text: 'Validation', link: '/VALIDATION' },
      { text: 'npm', link: 'https://www.npmjs.com/package/oauthlint' },
      { text: 'v0.2', link: 'https://github.com/Auspeo/oauthlint/releases' },
    ],
    sidebar: {
      '/rules/': [{ text: 'All rules', link: '/rules/' }, ...ruleSidebar()],
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/Auspeo/oauthlint' }],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    footer: {
      message: 'Released under the MIT License · powered by Semgrep',
      copyright: 'An <a href="https://github.com/Auspeo">Auspeo</a> project',
    },
  },
});
