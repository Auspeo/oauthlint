// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static site for oauthlint.dev, deployed to Cloudflare Pages.
// Output dir `dist/` is what the Pages workflow uploads.
export default defineConfig({
  site: 'https://oauthlint.dev',
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
