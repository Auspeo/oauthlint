import { execFile } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * Enforces that every fixture fires as annotated. For each fixture file we run
 * Semgrep (against that fixture's own rule) and assert that the NUMBER of
 * findings equals the number of `// ruleid:` annotations. `safe.ts` files carry
 * no `// ruleid:` annotations, so they must produce zero findings — the
 * false-positive guard; `vulnerable.ts` must produce exactly one finding per
 * annotated case — the false-negative guard. (We assert on counts rather than
 * exact lines because fixtures place the annotation above the whole statement,
 * while the match may land on an inner line.) This turns the safe/vulnerable
 * fixtures into a real, enforced contract rather than documentation.
 *
 * Each fixture file is scanned individually: Semgrep's built-in ignore list
 * skips `tests/` directories when walking, but honours an explicitly-passed
 * single file. Requires the `semgrep` binary; skipped locally if missing, but
 * CI installs it so the contract is always enforced there.
 */

const pexecFile = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, 'fixtures');
const rulesRoot = join(here, '..', 'rules');

function hasSemgrep(): boolean {
  try {
    execFileSync('semgrep', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
const semgrepAvailable = hasSemgrep();

const fixtureDirs = readdirSync(fixturesDir, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort();

function ruleFileFor(dir: string): string {
  const sep = dir.indexOf('-');
  return join(rulesRoot, dir.slice(0, sep), `${dir.slice(sep + 1)}.yml`);
}

function expectedCount(file: string): number {
  return readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.includes('// ruleid:')).length;
}

async function scanCount(ruleFile: string, target: string): Promise<number> {
  const { stdout } = await pexecFile(
    'semgrep',
    ['--config', ruleFile, '--json', '--quiet', '--no-git-ignore', '--metrics=off', target],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  return ((JSON.parse(stdout).results ?? []) as unknown[]).length;
}

// Pre-scan every fixture file (bounded concurrency) so the per-file tests are
// just assertions.
const actual = new Map<string, number>();

beforeAll(async () => {
  if (!semgrepAvailable) return;
  const jobs: { key: string; ruleFile: string; file: string }[] = [];
  for (const dir of fixtureDirs) {
    const ruleFile = ruleFileFor(dir);
    for (const kind of ['safe.ts', 'vulnerable.ts']) {
      const file = join(fixturesDir, dir, kind);
      if (existsSync(file)) jobs.push({ key: `${dir}/${kind}`, ruleFile, file });
    }
  }
  const concurrency = 8;
  for (let i = 0; i < jobs.length; i += concurrency) {
    const batch = jobs.slice(i, i + concurrency);
    const counts = await Promise.all(batch.map((j) => scanCount(j.ruleFile, j.file)));
    batch.forEach((j, idx) => actual.set(j.key, counts[idx]));
  }
}, 180_000);

describe.skipIf(!semgrepAvailable)('rule fixtures fire as annotated', () => {
  for (const dir of fixtureDirs) {
    for (const kind of ['safe.ts', 'vulnerable.ts']) {
      const file = join(fixturesDir, dir, kind);
      if (!existsSync(file)) continue;
      it(`${dir}/${kind}`, () => {
        expect(actual.get(`${dir}/${kind}`)).toBe(expectedCount(file));
      });
    }
  }
});
