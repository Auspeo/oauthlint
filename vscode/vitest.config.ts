import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // extension.ts is the VS Code activation glue (createDiagnosticCollection,
      // registerCommand, debounced scan orchestration). It is meaningful only
      // inside the Extension Development Host and is covered by integration
      // tests via @vscode/test-electron, not by unit tests. The extracted
      // logic it relies on (runner.ts, suppressions.ts) is unit-tested here.
      exclude: ['**/dist/**', '**/*.test.ts', 'src/extension.ts', '**/*.config.ts'],
      thresholds: {
        statements: 80,
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});
