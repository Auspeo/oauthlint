import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Root pinned to this folder so the include glob behaves identically
// whether vitest is invoked from the umbrella monorepo or from the
// per-product OAuthLint/oauthlint repo (post-split).
export default defineConfig({
  test: {
    root: fileURLToPath(new URL('.', import.meta.url)),
    globals: false,
    environment: 'node',
    include: ['*.test.ts'],
  },
});
