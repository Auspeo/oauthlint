import { defineConfig } from 'vitest/config';

// Fast, node-only tests for the data layer (no browser, no Astro runtime).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
