import { execFile, execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
//   - `contains`: substrings the fixed `vulnerable.*` MUST contain — proves the
//     fix produced the expected secure literal, not just *some* rewrite.
//   - `absent`:   substrings the fixed `vulnerable.*` MUST NOT contain — proves
//     the insecure literal is gone (and that no unsubstituted metavariable like
//     a literal `$OPTS` leaked into the output).
//   - `survives`: substrings present in the fixture that the fix must leave
//     intact — proves surrounding code was not mangled.
interface FixedRule {
  dir: string;
  ruleFile: string;
  ext: string;
  contains: string[];
  absent: string[];
  survives: string[];
}

const FIXED_RULES: FixedRule[] = [
  {
    dir: 'jwt-ignore-expiration',
    ruleFile: join(rulesRoot, 'jwt', 'ignore-expiration.yml'),
    ext: 'ts',
    // The disabled check is flipped back on; only the boolean changes.
    contains: ['ignoreExpiration: false'],
    absent: ['ignoreExpiration: true'],
    // Sibling options and the destructured-import form must survive untouched.
    survives: ["algorithms: ['RS256']", "audience: 'api'", 'verify(token, key, {'],
  },
  {
    dir: 'rust-tls-accept-invalid-certs',
    ruleFile: join(rulesRoot, 'rust', 'tls', 'accept-invalid-certs.yml'),
    ext: 'rs',
    contains: ['danger_accept_invalid_certs(false)'],
    absent: ['danger_accept_invalid_certs(true)'],
    survives: ['reqwest::Client::builder()', '.build()'],
  },
  {
    dir: 'rust-tls-accept-invalid-hostnames',
    ruleFile: join(rulesRoot, 'rust', 'tls', 'accept-invalid-hostnames.yml'),
    ext: 'rs',
    contains: ['danger_accept_invalid_hostnames(false)'],
    absent: ['danger_accept_invalid_hostnames(true)'],
    survives: ['reqwest::Client::builder()', '.build()'],
  },
  {
    dir: 'go-tls-insecure-skip-verify',
    ruleFile: join(rulesRoot, 'go', 'tls', 'insecure-skip-verify.yml'),
    ext: 'go',
    contains: ['InsecureSkipVerify: false'],
    absent: ['InsecureSkipVerify: true'],
    // The fix must touch only the flag, leaving the rest of the literal intact.
    survives: ['tls.Config{', 'MinVersion: tls.VersionTLS12'],
  },
  {
    dir: 'go-tls-min-version',
    ruleFile: join(rulesRoot, 'go', 'tls', 'min-version.yml'),
    ext: 'go',
    contains: ['MinVersion: tls.VersionTLS12'],
    absent: ['tls.VersionTLS10', 'tls.VersionTLS11', 'tls.VersionSSL30'],
    survives: ['tls.Config{', 'http.Transport{'],
  },
  {
    dir: 'go-cookie-insecure',
    ruleFile: join(rulesRoot, 'go', 'cookie', 'insecure.yml'),
    ext: 'go',
    // Both disabled flags are flipped to their secure value; `$FIELD` preserved.
    contains: ['Secure: true', 'HttpOnly: true'],
    absent: ['Secure: false', 'HttpOnly: false', '$FIELD'],
    survives: ['http.Cookie{', 'Name: "session"'],
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
    for (const { dir, ruleFile, ext, contains, absent, survives } of FIXED_RULES) {
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

        // The fix produced the expected secure literal, removed the insecure
        // one (and never leaked an unsubstituted metavariable), and left the
        // surrounding code intact.
        const fixed = readFileSync(dst, 'utf8');
        for (const needle of contains) expect(fixed).toContain(needle);
        for (const needle of absent) expect(fixed).not.toContain(needle);
        for (const needle of survives) expect(fixed).toContain(needle);
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
