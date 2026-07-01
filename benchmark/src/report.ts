import type { AdapterResult, BenchmarkResult } from './runner.js';

export interface ReportOptions {
  /**
   * Replace real model ids with stable `Model A`, `Model B`, ... labels. On by
   * default in the CLI: the benchmark is about the class of mistake, not a
   * league table of named commercial products.
   */
  anonymize: boolean;
}

/**
 * Build the id -> label mapping. Labels are assigned in sorted-id order so the
 * same set of models always maps to the same labels, independent of the order
 * they were run in.
 */
function anonymousLabels(result: BenchmarkResult): Map<string, string> {
  const ids = result.adapters.map((a) => a.adapterId).sort((a, b) => a.localeCompare(b));
  const labels = new Map<string, string>();
  ids.forEach((id, index) => {
    labels.set(id, `Model ${String.fromCharCode(65 + index)}`);
  });
  return labels;
}

/**
 * Return a copy of `result` with adapter ids replaced by anonymous labels.
 * Adapters are ordered by label (Model A, Model B, ...) so the report columns
 * read in order. The same mapping backs both the Markdown and JSON reports, so
 * no real model id leaks in either.
 */
export function anonymizeResult(result: BenchmarkResult): BenchmarkResult {
  const labels = anonymousLabels(result);
  const adapters = result.adapters
    .map((a) => ({
      ...a,
      adapterId: labels.get(a.adapterId) ?? a.adapterId,
      rules: a.rules.map((r) => ({ ...r })),
    }))
    .sort((a, b) => a.adapterId.localeCompare(b.adapterId));
  return { ...result, adapters };
}

/** Serialize the full result to pretty JSON. */
export function toJson(result: BenchmarkResult): string {
  return `${JSON.stringify(result, null, 2)}\n`;
}

function labelFor(adapter: AdapterResult): string {
  return adapter.adapterId;
}

/**
 * Render the result as a Markdown report: a methodology header, a one-line
 * summary per model, and a table whose rows are the rules that fired and whose
 * columns are the models (cells are the percentage of that model's samples that
 * contained the rule).
 */
export function toMarkdown(result: BenchmarkResult, options: ReportOptions): string {
  const shaped = options.anonymize ? anonymizeResult(result) : result;
  const adapters = shaped.adapters;

  const promptWord = result.promptCount === 1 ? 'prompt' : 'prompts';
  const sampleWord = result.samplesPerPrompt === 1 ? 'sample' : 'samples';

  const lines: string[] = [];
  lines.push('# OAuthLint AI codegen benchmark');
  lines.push('');
  lines.push(
    `Methodology: each model was given ${result.promptCount} fixed, neutrally worded auth-building ${promptWord}, ${result.samplesPerPrompt} ${sampleWord} each, and every generated file was scanned with the shipped OAuthLint rule pack. Percentages are the share of a model's scanned samples that contained at least one finding of a given rule. The run is reproducible: the prompt suite and rule pack are fixed and versioned.`,
  );
  lines.push('');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  for (const adapter of adapters) {
    const failed = adapter.failedSamples > 0 ? `, ${adapter.failedSamples} failed` : '';
    lines.push(
      `- **${labelFor(adapter)}**: ${adapter.anyFindingPercent}% of samples had at least one finding (${adapter.scannedSamples} scanned${failed}).`,
    );
  }
  lines.push('');

  // Union of rules that fired anywhere, ordered by peak prevalence then id.
  const peak = new Map<string, number>();
  const oauthlintIds = new Map<string, string>();
  for (const adapter of adapters) {
    for (const rule of adapter.rules) {
      peak.set(rule.ruleId, Math.max(peak.get(rule.ruleId) ?? 0, rule.percent));
      if (rule.oauthlintRuleId) oauthlintIds.set(rule.ruleId, rule.oauthlintRuleId);
    }
  }
  const ruleIds = [...peak.keys()].sort(
    (a, b) => (peak.get(b) ?? 0) - (peak.get(a) ?? 0) || a.localeCompare(b),
  );

  lines.push('## Findings by rule');
  lines.push('');
  if (ruleIds.length === 0) {
    lines.push('No findings were produced.');
    lines.push('');
    return `${lines.join('\n')}`;
  }

  const header = ['Rule', ...adapters.map(labelFor)];
  const divider = header.map(() => '---');
  lines.push(`| ${header.join(' | ')} |`);
  lines.push(`| ${divider.join(' | ')} |`);

  // Per-adapter quick lookup of rule -> percent.
  const byAdapter = adapters.map((a) => {
    const m = new Map<string, number>();
    for (const rule of a.rules) m.set(rule.ruleId, rule.percent);
    return m;
  });

  for (const ruleId of ruleIds) {
    const catalogueId = oauthlintIds.get(ruleId);
    const rowLabel = catalogueId ? `\`${ruleId}\` (${catalogueId})` : `\`${ruleId}\``;
    const cells = byAdapter.map((m) => (m.has(ruleId) ? `${m.get(ruleId)}%` : '-'));
    lines.push(`| ${rowLabel} | ${cells.join(' | ')} |`);
  }
  lines.push('');

  return `${lines.join('\n')}`;
}
