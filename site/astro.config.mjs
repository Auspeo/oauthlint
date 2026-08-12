import sitemap from '@astrojs/sitemap';
// @ts-check
import { defineConfig } from 'astro/config';

// Static site for oauthlint.dev, deployed to Cloudflare Pages.
// Output dir `dist/` is what the Pages workflow uploads.
export default defineConfig({
  site: 'https://oauthlint.dev',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    // Dual-theme highlighting for fenced code blocks, matching the fixture
    // highlighter in src/lib/highlight.ts. `defaultColor: false` emits both
    // `--shiki-light*` and `--shiki-dark*` CSS variables with no baked-in
    // color, so global.css can switch them on the site's [data-theme] toggle.
    // Without this, Astro's default single dark theme left light-mode code
    // blocks dark with faint, unreadable text.
    shikiConfig: {
      themes: { light: 'github-light-default', dark: 'github-dark-default' },
      defaultColor: false,
    },
  },
  build: {
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
