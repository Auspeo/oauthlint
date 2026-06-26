import { execFile, execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';

/**
 * Autofix safety contract. For every rule that ships a `fix:`, a wrong fix
 * silently corrupts a user's source — so each fix must be proven, not trusted.
 * For each entry below we:
 *   1. copy the rule's `vulnerable.*` fixture into a temp dir,
 *   2. run `semgrep --autofix` (the same flag the CLI's `--fix` maps to),
 *   3. assert the FIXED output, RE-SCANNED, yields ZERO findings for that rule
 *      (the fix actually resolves the finding — not just rewrites text), and
 *   4. assert the rule's `safe.*` fixture is byte-for-byte unchanged by autofix
 *      (the fix never touches compliant code).
 *
 * Only rules whose fix is an unambiguous, syntactically-valid literal
 * replacement are listed here. Rules where a correct fix is not mechanically
 * derivable (e.g. CORS allow-origin can't be auto-chosen; removing a JWT
 * option or swapping Math.random() for a CSPRNG isn't a clean Semgrep rewrite;
 * pkce-plain mixes regex + AST branches that no single fix template can
 * reconstruct) deliberately ship NO fix and are absent here.
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

// Each rule that ships a `fix:`, with the fixture extension and the rule id we
// re-scan for. `dir` is the fixture directory under tests/fixtures/.
const FIXED_RULES: { dir: string; ruleFile: string; ext: string }[] = [
  {
    dir: 'rust-tls-accept-invalid-certs',
    ruleFile: join(rulesRoot, 'rust', 'tls', 'accept-invalid-certs.yml'),
    ext: 'rs',
  },
  {
    dir: 'rust-tls-accept-invalid-hostnames',
    ruleFile: join(rulesRoot, 'rust', 'tls', 'accept-invalid-hostnames.yml'),
    ext: 'rs',
  },
];

const workDirs: string[] = [];
afterAll(() => {
  for (const d of workDirs) rmSync(d, { recursive: true, force: true });
});

async function scanCount(ruleFile: string, target: string): Promise<number> {
  const { stdout } = await pexecFile(
    'semgrep',
    ['--config', ruleFile, '--json', '--quiet', '--no-git-ignore', '--metrics=off', target],
    { maxBuffer: 32 * 1024 * 1024 },
  );
  return ((JSON.parse(stdout).results ?? []) as unknown[]).length;
}

async function autofix(ruleFile: string, target: string): Promise<void> {
  await pexecFile(
    'semgrep',
    ['--config', ruleFile, '--autofix', '--quiet', '--no-git-ignore', '--metrics=off', target],
    { maxBuffer: 32 * 1024 * 1024 },
  );
}

describe.skipIf(!semgrepAvailable)(
  'rule autofixes resolve the finding without corrupting source',
  () => {
    for (const { dir, ruleFile, ext } of FIXED_RULES) {
      // Each case runs three Semgrep invocations (scan + autofix + re-scan), so
      // the default 5s per-test budget is too tight on a cold binary.
      it(`${dir}: vulnerable fixture is fixed and re-scan = 0`, { timeout: 60_000 }, async () => {
        const work = mkdtempSync(join(tmpdir(), 'oauthlint-fix-'));
        workDirs.push(work);
        const src = join(fixturesDir, dir, `vulnerable.${ext}`);
        const dst = join(work, `vulnerable.${ext}`);
        copyFileSync(src, dst);

        // Sanity: the fixture must actually fire before we fix it, otherwise the
        // "re-scan = 0" assertion would pass vacuously.
        const before = await scanCount(ruleFile, dst);
        expect(before).toBeGreaterThan(0);

        await autofix(ruleFile, dst);

        // The crux: the fixed source no longer triggers the rule.
        const after = await scanCount(ruleFile, dst);
        expect(after).toBe(0);

        // The fix must not have mangled surrounding code: the original `true`
        // literal is gone and replaced by `false`, and the call/chain survives.
        const fixed = readFileSync(dst, 'utf8');
        const method = basename(ruleFile, '.yml').includes('hostnames')
          ? 'danger_accept_invalid_hostnames'
          : 'danger_accept_invalid_certs';
        expect(fixed).toContain(`${method}(false)`);
        expect(fixed).not.toContain(`${method}(true)`);
        // Untouched neighbours from the fixture stay intact.
        expect(fixed).toContain('.build()');
        expect(fixed).toContain('reqwest::Client::builder()');
      });

      it(`${dir}: safe fixture is left byte-for-byte unchanged`, { timeout: 60_000 }, async () => {
        const work = mkdtempSync(join(tmpdir(), 'oauthlint-fix-safe-'));
        workDirs.push(work);
        const src = join(fixturesDir, dir, `safe.${ext}`);
        const dst = join(work, `safe.${ext}`);
        copyFileSync(src, dst);

        const original = readFileSync(src, 'utf8');
        await autofix(ruleFile, dst);
        expect(readFileSync(dst, 'utf8')).toBe(original);
      });
    }
  },
);
