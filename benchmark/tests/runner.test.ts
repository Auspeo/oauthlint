import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { MockAdapter } from '../src/adapters/mock.js';
import { selectPrompts } from '../src/prompts.js';
import { runBenchmark } from '../src/runner.js';

// A small, fixed subset that exercises both mock code pools (a JS/Express
// snippet and a Python/FastAPI snippet). Each scan shells out to Semgrep and is
// slow, so the tests deliberately keep the sample count low.
const SUBSET = selectPrompts(['express-login-session', 'fastapi-cors']);

/**
 * The runner shells out to Semgrep (the mock still scans real code). When
 * Semgrep is not installed, the scan-dependent test is skipped, mirroring the
 * rule pack's own `hasSemgrep()` guard in rules/tests/fixes.test.ts.
 */
function hasSemgrep(): boolean {
  try {
    execFileSync('semgrep', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const semgrepAvailable = hasSemgrep();

describe.skipIf(!semgrepAvailable)('runBenchmark with MockAdapter', () => {
  it('produces findings and a well-formed aggregate', async () => {
    const samples = 3;
    const result = await runBenchmark({
      adapters: [new MockAdapter()],
      samples,
      prompts: SUBSET,
    });

    expect(result.promptCount).toBe(SUBSET.length);
    expect(result.samplesPerPrompt).toBe(samples);
    expect(result.adapters).toHaveLength(1);

    const mock = result.adapters[0];
    expect(mock).toBeDefined();
    if (!mock) return;

    expect(mock.adapterId).toBe('mock');
    expect(mock.totalSamples).toBe(SUBSET.length * samples);
    // The mock never fails to "generate", so everything is scanned.
    expect(mock.failedSamples).toBe(0);
    expect(mock.scannedSamples).toBe(mock.totalSamples);

    // The mock's canned code carries real anti-patterns, so findings must fire.
    expect(mock.rules.length).toBeGreaterThan(0);
    expect(mock.samplesWithAnyFinding).toBeGreaterThan(0);
    expect(mock.anyFindingPercent).toBeGreaterThan(0);
    expect(mock.anyFindingPercent).toBeLessThanOrEqual(100);

    // Every tally is internally consistent.
    for (const rule of mock.rules) {
      expect(rule.ruleId).toMatch(/^auth\./);
      expect(rule.samplesWithFinding).toBeGreaterThan(0);
      expect(rule.samplesWithFinding).toBeLessThanOrEqual(mock.scannedSamples);
      expect(rule.percent).toBe(Math.round((rule.samplesWithFinding / mock.scannedSamples) * 100));
    }

    // Rules are sorted by descending prevalence.
    const counts = mock.rules.map((r) => r.samplesWithFinding);
    const sorted = [...counts].sort((a, b) => b - a);
    expect(counts).toEqual(sorted);
  });

  it('is deterministic: the mock yields identical tallies across runs', async () => {
    const opts = { adapters: [new MockAdapter()], samples: 2, prompts: SUBSET };
    const a = await runBenchmark(opts);
    const b = await runBenchmark(opts);
    expect(a.adapters[0]?.rules).toEqual(b.adapters[0]?.rules);
    expect(a.adapters[0]?.samplesWithAnyFinding).toBe(b.adapters[0]?.samplesWithAnyFinding);
  });
});
