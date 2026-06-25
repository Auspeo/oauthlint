// @ts-check
import { defineConfig } from 'astro/config';

// Static site for oauthlint.dev, deployed to Cloudflare Pages.
// Output dir `dist/` is what the Pages workflow uploads.
export default defineConfig({
  site: 'https://oauthlint.dev',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
  },
  devToolbar: { enabled: false },
});
