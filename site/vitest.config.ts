import { defineConfig } from 'vitest/config';

// Fast, node-only tests for the site (data layer + content guards).
// No browser, no Astro runtime.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
