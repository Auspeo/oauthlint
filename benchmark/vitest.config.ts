import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Each scan shells out to Semgrep, which reloads the whole rule pack per
    // invocation (~4s). The scan-dependent tests run several in series, so the
    // default 5s per-test timeout is far too tight.
    testTimeout: 120_000,
  },
});
