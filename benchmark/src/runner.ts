import type { ModelAdapter } from './adapters/types.js';
import { extractCode } from './adapters/types.js';
import type { Prompt } from './prompts.js';
import { scanGenerated } from './scanner.js';

/** How often one rule fired across an adapter's samples. */
export interface RuleTally {
  /** Human-readable rule id, e.g. `auth.jwt.alg-none`. */
  ruleId: string;
  /** OAuthLint catalogue id, e.g. `AUTH-JWT-001`, when the rule reports one. */
  oauthlintRuleId?: string;
  /** Number of scanned samples that contained at least one finding of this rule. */
  samplesWithFinding: number;
  /** `samplesWithFinding` as a percentage of scanned samples (0-100, rounded). */
  percent: number;
}

/** One model's results across the whole prompt suite. */
export interface AdapterResult {
  adapterId: string;
  /** Samples attempted (prompts x samples-per-prompt). */
  totalSamples: number;
  /** Samples whose generation threw and were skipped. */
  failedSamples: number;
  /** Samples that were generated and scanned (`total - failed`). */
  scannedSamples: number;
  /** Scanned samples with at least one finding of any rule. */
  samplesWithAnyFinding: number;
  /** `samplesWithAnyFinding` as a percentage of scanned samples (0-100, rounded). */
  anyFindingPercent: number;
  /** Per-rule tallies, sorted by descending prevalence then rule id. */
  rules: RuleTally[];
}

export interface BenchmarkResult {
  /** Number of prompts in the run. */
  promptCount: number;
  /** Samples generated per prompt per model. */
  samplesPerPrompt: number;
  /** ISO timestamp of when the run finished. */
  generatedAt: string;
  /** One entry per model, in the order the adapters were provided. */
  adapters: AdapterResult[];
}

export interface RunBenchmarkOptions {
  adapters: ModelAdapter[];
  /** Samples to generate per prompt per model. */
  samples: number;
  prompts: readonly Prompt[];
}

function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

/**
 * Run the benchmark: for each adapter, generate `samples` completions of every
 * prompt, scan each with the OAuthLint pack, and tally which rules fired.
 *
 * A generation that throws (e.g. a transient API error) is skipped and counted
 * in `failedSamples` rather than aborting the run. A sample that generates but
 * produces no findings still counts toward `scannedSamples`.
 */
export async function runBenchmark(options: RunBenchmarkOptions): Promise<BenchmarkResult> {
  const { adapters, samples, prompts } = options;
  const results: AdapterResult[] = [];

  for (const adapter of adapters) {
    let totalSamples = 0;
    let failedSamples = 0;
    let scannedSamples = 0;
    let samplesWithAnyFinding = 0;
    // ruleId -> { count, oauthlintRuleId }
    const tallies = new Map<string, { count: number; oauthlintRuleId?: string }>();

    for (const prompt of prompts) {
      for (let i = 0; i < samples; i++) {
        totalSamples++;
        let code: string;
        try {
          const raw = await adapter.generate(prompt.prompt);
          code = extractCode(raw);
        } catch {
          // Skip a failed generation but keep the run going.
          failedSamples++;
          continue;
        }

        const findings = await scanGenerated(code, prompt.language);
        scannedSamples++;

        // Distinct rules that fired in THIS sample; each contributes at most one
        // to a rule's per-sample count.
        const seenInSample = new Set<string>();
        for (const finding of findings) {
          if (seenInSample.has(finding.ruleId)) continue;
          seenInSample.add(finding.ruleId);
          const entry = tallies.get(finding.ruleId) ?? { count: 0 };
          entry.count++;
          if (finding.oauthlintRuleId) entry.oauthlintRuleId = finding.oauthlintRuleId;
          tallies.set(finding.ruleId, entry);
        }
        if (seenInSample.size > 0) samplesWithAnyFinding++;
      }
    }

    const rules: RuleTally[] = [...tallies.entries()]
      .map(([ruleId, { count, oauthlintRuleId }]) => ({
        ruleId,
        oauthlintRuleId,
        samplesWithFinding: count,
        percent: pct(count, scannedSamples),
      }))
      .sort(
        (a, b) => b.samplesWithFinding - a.samplesWithFinding || a.ruleId.localeCompare(b.ruleId),
      );

    results.push({
      adapterId: adapter.id,
      totalSamples,
      failedSamples,
      scannedSamples,
      samplesWithAnyFinding,
      anyFindingPercent: pct(samplesWithAnyFinding, scannedSamples),
      rules,
    });
  }

  return {
    promptCount: prompts.length,
    samplesPerPrompt: samples,
    generatedAt: new Date().toISOString(),
    adapters: results,
  };
}
