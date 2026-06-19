import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      // index.ts and manifest.ts are pure re-export barrels (no logic).
      exclude: [
        '**/dist/**',
        '**/*.test.ts',
        'tests/fixtures/**',
        'src/index.ts',
        'src/manifest.ts',
        '**/*.config.ts',
      ],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
