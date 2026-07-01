import { describe, expect, it } from 'vitest';
import { anonymizeResult, toJson, toMarkdown } from '../src/report.js';
import type { BenchmarkResult } from '../src/runner.js';

const RESULT: BenchmarkResult = {
  promptCount: 2,
  samplesPerPrompt: 3,
  generatedAt: '2026-01-01T00:00:00.000Z',
  adapters: [
    {
      adapterId: 'gpt-4o',
      totalSamples: 6,
      failedSamples: 0,
      scannedSamples: 6,
      samplesWithAnyFinding: 5,
      anyFindingPercent: 83,
      rules: [
        {
          ruleId: 'auth.jwt.alg-none',
          oauthlintRuleId: 'AUTH-JWT-001',
          samplesWithFinding: 3,
          percent: 50,
        },
        { ruleId: 'auth.cors.wildcard-with-credentials', samplesWithFinding: 2, percent: 33 },
      ],
    },
    {
      adapterId: 'claude-sonnet',
      totalSamples: 6,
      failedSamples: 1,
      scannedSamples: 5,
      samplesWithAnyFinding: 2,
      anyFindingPercent: 40,
      rules: [
        {
          ruleId: 'auth.jwt.alg-none',
          oauthlintRuleId: 'AUTH-JWT-001',
          samplesWithFinding: 2,
          percent: 40,
        },
      ],
    },
  ],
};

describe('toMarkdown', () => {
  it('renders a table with a column per model and a row per rule', () => {
    const md = toMarkdown(RESULT, { anonymize: false });
    expect(md).toContain('| Rule | gpt-4o | claude-sonnet |');
    expect(md).toContain('auth.jwt.alg-none');
    expect(md).toContain('auth.cors.wildcard-with-credentials');
    // Cell values render as percentages; a missing rule is a dash.
    expect(md).toContain('50%');
    expect(md).toContain('40%');
    expect(md).toMatch(/wildcard-with-credentials`? \| 33% \| - \|/);
    // Per-model summary line.
    expect(md).toContain('83% of samples');
    expect(md).toContain('1 failed');
  });

  it('anonymizes model ids to stable Model A / Model B labels', () => {
    const md = toMarkdown(RESULT, { anonymize: true });
    expect(md).toContain('Model A');
    expect(md).toContain('Model B');
    // No real model id may leak.
    expect(md).not.toContain('gpt-4o');
    expect(md).not.toContain('claude-sonnet');
    // Labels are assigned by sorted id: "claude-sonnet" < "gpt-4o" -> A, B.
    expect(md.indexOf('| Rule | Model A | Model B |')).toBeGreaterThan(-1);
  });
});

describe('anonymizeResult', () => {
  it('maps ids deterministically by sorted id without mutating the input', () => {
    const anon = anonymizeResult(RESULT);
    expect(anon.adapters.map((a) => a.adapterId)).toEqual(['Model A', 'Model B']);
    // Model A is the alphabetically-first id (claude-sonnet), carrying its data.
    expect(anon.adapters[0]?.anyFindingPercent).toBe(40);
    expect(anon.adapters[1]?.anyFindingPercent).toBe(83);
    // Input is untouched.
    expect(RESULT.adapters[0]?.adapterId).toBe('gpt-4o');
  });
});

describe('toJson', () => {
  it('serializes the full result as parseable JSON', () => {
    const parsed = JSON.parse(toJson(RESULT)) as BenchmarkResult;
    expect(parsed.promptCount).toBe(2);
    expect(parsed.adapters).toHaveLength(2);
    expect(parsed.adapters[0]?.rules[0]?.ruleId).toBe('auth.jwt.alg-none');
  });
});
