#!/usr/bin/env node
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
/**
 * Real-world rule pack validation harness.
 *
 * For each target in `validation-targets.yml`:
 *   1. shallow-clone the repo into `.validation/<owner>__<name>` (cached)
 *   2. run `oauthlint scan` against it (Semgrep required)
 *   3. accumulate per-rule fire counts + per-target totals
 *   4. write `validation-report.json` + a human-readable Markdown summary
 *
 * The output goes into `validation-report.md` and is intended to be
 * read like a triage queue: high-signal targets that fire many rules
 * are the "expected" cases, low-signal targets that fire ANY rule
 * are flagged for false-positive investigation.
 *
 * Usage: pnpm validate
 */
import { execa } from 'execa';
import { parse as parseYaml } from 'yaml';

// Layout (after the upcoming OAuthLint/oauthlint repo split):
//   <repo-root>/
//     scripts/validate-rules.ts       ← this file
//     scripts/validation-targets.yml  ← which repos to clone
//     cli/bin/oauthlint.js            ← the binary we invoke
//     .validation/                    ← cache of shallow clones (gitignored)
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = join(ROOT, '.validation');
const CLI_BIN = join(ROOT, 'cli', 'bin', 'oauthlint.js');
const TARGETS_PATH = join(ROOT, 'scripts', 'validation-targets.yml');

interface Target {
  repo: string;
  ref?: string;
  expectedSignal: 'low' | 'high';
  notes?: string;
}

interface TargetsFile {
  version: number;
  targets: Target[];
}

interface Finding {
  ruleId: string;
  severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  filePath: string;
  startLine: number;
}

interface ScanReport {
  findings: Finding[];
  scannedFiles: number;
  durationMs: number;
}

interface TargetResult {
  target: Target;
  cloneDurationMs: number;
  scanDurationMs: number;
  scannedFiles: number;
  totalFindings: number;
  ruleCounts: Record<string, number>;
  error?: string;
}

async function semgrepAvailable(): Promise<boolean> {
  try {
    const { exitCode } = await execa('semgrep', ['--version'], { reject: false });
    return exitCode === 0;
  } catch {
    return false;
  }
}

async function ensureDir(p: string): Promise<void> {
  try {
    await stat(p);
  } catch {
    await mkdir(p, { recursive: true });
  }
}

async function cloneOrFetch(target: Target): Promise<{ path: string; durationMs: number }> {
  const slug = target.repo.replace('/', '__');
  const dest = join(CACHE_DIR, slug);
  const start = Date.now();
  let alreadyCloned = false;
  try {
    await stat(join(dest, '.git'));
    alreadyCloned = true;
  } catch {
    /* not cloned yet */
  }

  if (alreadyCloned) {
    const fetchArgs = ['fetch', '--depth', '1', 'origin', target.ref ?? 'HEAD'];
    await execa('git', fetchArgs, { cwd: dest, reject: false });
    await execa('git', ['reset', '--hard', 'FETCH_HEAD'], { cwd: dest, reject: false });
  } else {
    const url = `https://github.com/${target.repo}.git`;
    const args = ['clone', '--depth', '1'];
    if (target.ref) args.push('--branch', target.ref);
    args.push(url, dest);
    await execa('git', args, { stdout: 'inherit', stderr: 'inherit' });
  }
  return { path: dest, durationMs: Date.now() - start };
}

async function scan(target: Target, repoPath: string): Promise<TargetResult> {
  const start = Date.now();
  try {
    const { stdout } = await execa(
      'node',
      [CLI_BIN, 'scan', repoPath, '--json', '--fail-on', 'off'],
      { reject: false, maxBuffer: 200 * 1024 * 1024 },
    );
    const report = JSON.parse(stdout) as ScanReport;
    const ruleCounts: Record<string, number> = {};
    for (const f of report.findings) {
      ruleCounts[f.ruleId] = (ruleCounts[f.ruleId] ?? 0) + 1;
    }
    return {
      target,
      cloneDurationMs: 0,
      scanDurationMs: Date.now() - start,
      scannedFiles: report.scannedFiles,
      totalFindings: report.findings.length,
      ruleCounts,
    };
  } catch (err) {
    return {
      target,
      cloneDurationMs: 0,
      scanDurationMs: Date.now() - start,
      scannedFiles: 0,
      totalFindings: 0,
      ruleCounts: {},
      error: (err as Error).message,
    };
  }
}

function renderMarkdown(results: TargetResult[]): string {
  const lines: string[] = [];
  lines.push('# OAuthLint — real-world validation report');
  lines.push('');
  lines.push(`Generated at ${new Date().toISOString()}.`);
  lines.push('');

  lines.push('## Summary');
  lines.push('');
  lines.push('| Repo | Signal | Files | Findings | Distinct rules | Status |');
  lines.push('|------|--------|-------|----------|----------------|--------|');
  for (const r of results) {
    const status = r.error ? `❌ ${r.error.slice(0, 80)}` : '✓';
    lines.push(
      `| ${r.target.repo} | ${r.target.expectedSignal} | ${r.scannedFiles} | ${r.totalFindings} | ${Object.keys(r.ruleCounts).length} | ${status} |`,
    );
  }
  lines.push('');

  lines.push('## False-positive triage queue');
  lines.push('');
  lines.push('Findings on `low` signal targets — investigate each.');
  lines.push('');
  let triageCount = 0;
  for (const r of results) {
    if (r.target.expectedSignal !== 'low') continue;
    if (r.totalFindings === 0) continue;
    triageCount++;
    lines.push(`### ${r.target.repo}`);
    lines.push('');
    if (r.target.notes) {
      lines.push(`> ${r.target.notes}`);
      lines.push('');
    }
    lines.push('| Rule | Count |');
    lines.push('|------|-------|');
    for (const [ruleId, count] of Object.entries(r.ruleCounts).sort((a, b) => b[1] - a[1])) {
      lines.push(`| \`${ruleId}\` | ${count} |`);
    }
    lines.push('');
  }
  if (triageCount === 0) {
    lines.push('_None — every low-signal target produced zero findings. 🎉_');
    lines.push('');
  }

  lines.push('## Per-rule activity');
  lines.push('');
  lines.push('How often each rule fired across all targets, sorted by total.');
  lines.push('');
  const totals = new Map<string, number>();
  for (const r of results) {
    for (const [ruleId, count] of Object.entries(r.ruleCounts)) {
      totals.set(ruleId, (totals.get(ruleId) ?? 0) + count);
    }
  }
  lines.push('| Rule | Total fires |');
  lines.push('|------|-------------|');
  for (const [ruleId, count] of [...totals.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| \`${ruleId}\` | ${count} |`);
  }
  if (totals.size === 0) {
    lines.push('| _(no rules fired)_ | 0 |');
  }
  lines.push('');

  return lines.join('\n');
}

async function main(): Promise<void> {
  if (!(await semgrepAvailable())) {
    console.error('Semgrep is not on PATH. Install it first:');
    console.error('  pipx install semgrep   (or)   brew install semgrep');
    process.exit(127);
  }

  await ensureDir(CACHE_DIR);
  const targets = parseYaml(await readFile(TARGETS_PATH, 'utf8')) as TargetsFile;

  const results: TargetResult[] = [];
  for (const target of targets.targets) {
    console.log(`▶ ${target.repo} [${target.expectedSignal}]`);
    try {
      const { path, durationMs: cloneMs } = await cloneOrFetch(target);
      const r = await scan(target, path);
      r.cloneDurationMs = cloneMs;
      results.push(r);
      console.log(
        `  ${r.scannedFiles} files, ${r.totalFindings} findings, ${
          Object.keys(r.ruleCounts).length
        } distinct rules — ${r.scanDurationMs}ms`,
      );
    } catch (err) {
      console.error(`  ✗ ${(err as Error).message}`);
      results.push({
        target,
        cloneDurationMs: 0,
        scanDurationMs: 0,
        scannedFiles: 0,
        totalFindings: 0,
        ruleCounts: {},
        error: (err as Error).message,
      });
    }
  }

  await writeFile(
    join(ROOT, 'validation-report.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
    'utf8',
  );
  await writeFile(join(ROOT, 'validation-report.md'), renderMarkdown(results), 'utf8');
  console.log('');
  console.log('✓ Wrote validation-report.json + validation-report.md');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
