import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // Scanning a real snippet shells out to Semgrep, which can take a few
    // seconds on a cold cache; give the suite room beyond Vitest's 5s default.
    testTimeout: 60_000,
  },
});
