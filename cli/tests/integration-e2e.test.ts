import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import { describe, expect, it } from 'vitest';

/**
 * Functional / end-to-end suite.
 *
 * Every test here drives the REAL published entrypoint — `bin/oauthlint.js`,
 * which loads the compiled `dist/` build — as a child process via `execa`,
 * exactly as a user (or CI) would. We assert on observable behaviour only:
 * stdout/stderr, exit codes, and the well-formedness of machine-readable
 * reports. Nothing imports `src/` internals, so this catches wiring/packaging
 * regressions that unit tests of internals cannot.
 *
 * Scenarios that actually run Semgrep are gated behind `e2e` (a `describe` that
 * becomes `describe.skip` when Semgrep is missing) so a clean dev laptop or a
 * Semgrep-less CI lane stays green; the commands that don't need Semgrep
 * (`explain`, `list`) always run.
 */

const CLI_BIN = fileURLToPath(new URL('../bin/oauthlint.js', import.meta.url));
// cli/tests/ → examples/vibe-app-express (the deliberately-vulnerable app).
const EXAMPLE_APP = fileURLToPath(new URL('../../examples/vibe-app-express', import.meta.url));

/** A canonical alg:none anti-pattern — fires `auth.jwt.alg-none` (HIGH). */
const VULN_JWT = [
  "import jwt from 'jsonwebtoken';",
  "export const verify = (t: string) => jwt.verify(t, 'k', { algorithms: ['none'] });",
  '',
].join('\n');

/** A hardcoded provider secret — fires `auth.oauth.hardcoded-secret`. */
const VULN_SECRET = [
  'export const oauthClient = {',
  "  client_id: 'app',",
  "  client_secret: 's3cr3t-oauth-credential-value-001',",
  '};',
  '',
].join('\n');

/** No auth anti-patterns — must yield zero findings. */
const CLEAN = 'export function add(a: number, b: number): number {\n  return a + b;\n}\n';

interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Run the built CLI as a child process. `NO_UPDATE_NOTIFIER` keeps stdout free
 * of the "update available" notice so reports are byte-for-byte deterministic.
 * `reject: false` lets us assert on non-zero exit codes (the whole point of the
 * gating tests) rather than throwing.
 */
async function runCli(args: string[], opts: { cwd?: string } = {}): Promise<CliResult> {
  const { exitCode, stdout, stderr } = await execa('node', [CLI_BIN, ...args], {
    cwd: opts.cwd,
    reject: false,
    env: { ...process.env, NO_UPDATE_NOTIFIER: '1' },
  });
  return { exitCode: exitCode ?? 0, stdout, stderr };
}

// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping ANSI colour codes.
const stripAnsi = (s: string): string => s.replace(/\[[0-9;]*m/g, '');

async function semgrepAvailable(): Promise<boolean> {
  try {
    const { exitCode } = await execa('semgrep', ['--version'], { reject: false });
    return exitCode === 0;
  } catch {
    return false;
  }
}

const hasSemgrep = await semgrepAvailable();
// Semgrep-dependent scenarios skip cleanly when Semgrep is absent.
const e2e = hasSemgrep ? describe : describe.skip;

const SCAN_TIMEOUT = 60_000;

interface JsonReport {
  schemaVersion: string;
  findings: Array<{
    ruleId: string;
    severity: string;
    filePath: string;
    startLine: number;
    endLine: number;
    message: string;
  }>;
}

const ruleIds = (r: JsonReport): Set<string> => new Set(r.findings.map((f) => f.ruleId));
const basenames = (r: JsonReport): Set<string> =>
  new Set(r.findings.map((f) => f.filePath.split('/').pop() ?? f.filePath));

e2e('scan — vulnerable vs clean code', () => {
  it(
    'surfaces the canonical demo bugs on the vulnerable example app',
    async () => {
      const { exitCode, stdout } = await runCli(['scan', EXAMPLE_APP, '--json']);
      // HIGH findings present → fail-on defaults to HIGH → exit 1.
      expect(exitCode).toBe(1);
      const report = JSON.parse(stdout) as JsonReport;
      expect(report.schemaVersion).toBe('oauthlint-v1');
      const rules = ruleIds(report);
      expect(rules.size).toBeGreaterThanOrEqual(6);
      // High-signal, unambiguous bugs that must always fire on the example.
      expect(rules.has('auth.jwt.alg-none')).toBe(true);
      expect(rules.has('auth.oauth.hardcoded-secret')).toBe(true);
      expect(rules.has('auth.oauth.wildcard-redirect')).toBe(true);
    },
    SCAN_TIMEOUT,
  );

  it(
    'reports nothing and exits 0 on clean code',
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'oauthlint-clean-'));
      try {
        await writeFile(join(dir, 'ok.ts'), CLEAN);
        const { exitCode, stdout } = await runCli(['scan', dir, '--json']);
        expect(exitCode).toBe(0);
        const report = JSON.parse(stdout) as JsonReport;
        expect(report.findings).toEqual([]);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );
});

e2e('scan — report formats are well-formed', () => {
  it(
    '--json / --format json produces a parseable report with the documented shape',
    async () => {
      const { stdout } = await runCli(['scan', EXAMPLE_APP, '--format', 'json']);
      const report = JSON.parse(stdout) as JsonReport;
      expect(report.schemaVersion).toBe('oauthlint-v1');
      expect(Array.isArray(report.findings)).toBe(true);
      for (const f of report.findings) {
        expect(typeof f.ruleId).toBe('string');
        expect(typeof f.severity).toBe('string');
        expect(typeof f.filePath).toBe('string');
        expect(typeof f.startLine).toBe('number');
        expect(typeof f.message).toBe('string');
      }
    },
    SCAN_TIMEOUT,
  );

  it(
    '--format sarif produces a valid SARIF 2.1.0 document (runs/results/driver)',
    async () => {
      const { stdout } = await runCli(['scan', EXAMPLE_APP, '--format', 'sarif']);
      const sarif = JSON.parse(stdout) as {
        version: string;
        $schema: string;
        runs: Array<{
          tool: { driver: { name: string; rules: Array<{ id: string }> } };
          results: Array<{ ruleId: string; level: string }>;
        }>;
      };
      expect(sarif.version).toBe('2.1.0');
      expect(sarif.$schema).toMatch(/sarif-2\.1\.0/);
      expect(sarif.runs).toHaveLength(1);
      const run = sarif.runs[0];
      expect(run.tool.driver.name).toBe('OAuthLint');
      expect(run.results.length).toBeGreaterThan(0);
      // Every result references a rule that is actually defined in the driver.
      const defined = new Set(run.tool.driver.rules.map((r) => r.id));
      for (const res of run.results) {
        expect(defined.has(res.ruleId)).toBe(true);
        expect(['note', 'warning', 'error']).toContain(res.level);
      }
    },
    SCAN_TIMEOUT,
  );

  it(
    '--format html produces a self-contained document carrying the findings',
    async () => {
      const { stdout: html } = await runCli(['scan', EXAMPLE_APP, '--format', 'html']);
      expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
      expect(html).toContain('</html>');
      expect(html).toContain('<style>');
      expect(html).toContain('auth.jwt.alg-none');
      // Self-contained: no executable script and no external resource requests.
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/src=["']https?:/i);
      expect(html).not.toMatch(/<link\b/i);
    },
    SCAN_TIMEOUT,
  );

  it(
    '--format html escapes hostile snippets read from source (no injection)',
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'oauthlint-html-'));
      try {
        // A single flagged line that ALSO carries a <script> payload in a
        // trailing comment, so the payload lands inside the rendered code
        // snippet. The report must escape it, never emit a live tag.
        await writeFile(
          join(dir, 'x.ts'),
          "export const oauthClient = { client_secret: 's3cr3t-oauth-credential-value-001' }; // <script>alert(1)</script>\n",
        );
        const { stdout: html } = await runCli(['scan', dir, '--format', 'html']);
        expect(html).not.toMatch(/<script/i);
        expect(html).toContain('&lt;script&gt;');
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );
});

e2e('scan — --fail-on gates the exit code', () => {
  it(
    'exits non-zero when a HIGH finding meets --fail-on HIGH',
    async () => {
      const { exitCode } = await runCli(['scan', EXAMPLE_APP, '--fail-on', 'HIGH']);
      expect(exitCode).toBeGreaterThanOrEqual(1);
    },
    SCAN_TIMEOUT,
  );

  it(
    'exits 0 with --fail-on off even though findings exist',
    async () => {
      const { exitCode, stdout } = await runCli([
        'scan',
        EXAMPLE_APP,
        '--fail-on',
        'off',
        '--json',
      ]);
      expect(exitCode).toBe(0);
      // Output still contains the findings — only the gate is disabled.
      expect((JSON.parse(stdout) as JsonReport).findings.length).toBeGreaterThan(0);
    },
    SCAN_TIMEOUT,
  );
});

e2e('scan — --severity filters output', () => {
  it(
    'drops everything below the threshold (CRITICAL: none in the example → empty)',
    async () => {
      const { stdout } = await runCli([
        'scan',
        EXAMPLE_APP,
        '--severity',
        'CRITICAL',
        '--fail-on',
        'off',
        '--json',
      ]);
      expect((JSON.parse(stdout) as JsonReport).findings).toEqual([]);
    },
    SCAN_TIMEOUT,
  );

  it(
    'keeps only findings at or above the threshold (HIGH ⇒ HIGH/CRITICAL only)',
    async () => {
      const full = JSON.parse(
        (await runCli(['scan', EXAMPLE_APP, '--fail-on', 'off', '--json'])).stdout,
      ) as JsonReport;
      const filtered = JSON.parse(
        (await runCli(['scan', EXAMPLE_APP, '--severity', 'HIGH', '--fail-on', 'off', '--json']))
          .stdout,
      ) as JsonReport;

      expect(filtered.findings.length).toBeGreaterThan(0);
      // The example carries sub-HIGH findings too, so filtering must shrink it.
      expect(filtered.findings.length).toBeLessThan(full.findings.length);
      for (const f of filtered.findings) {
        expect(['HIGH', 'CRITICAL']).toContain(f.severity);
      }
    },
    SCAN_TIMEOUT,
  );
});

e2e('scan — multiple path arguments', () => {
  it(
    'scans every path passed and attributes findings to each',
    async () => {
      const root = await mkdtemp(join(tmpdir(), 'oauthlint-multi-'));
      try {
        const a = join(root, 'a');
        const b = join(root, 'b');
        await mkdir(a);
        await mkdir(b);
        await writeFile(join(a, 'jwt.ts'), VULN_JWT);
        await writeFile(join(b, 'secret.ts'), VULN_SECRET);

        const { stdout } = await runCli(['scan', a, b, '--fail-on', 'off', '--json']);
        const report = JSON.parse(stdout) as JsonReport;
        const files = basenames(report);
        expect(files.has('jwt.ts')).toBe(true);
        expect(files.has('secret.ts')).toBe(true);
        const rules = ruleIds(report);
        expect(rules.has('auth.jwt.alg-none')).toBe(true);
        expect(rules.has('auth.oauth.hardcoded-secret')).toBe(true);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );
});

e2e('scan — incremental scoping in a git repo (--staged / --diff)', () => {
  /** A throwaway git repo with one committed file on `main`. */
  async function makeRepo(): Promise<string> {
    const dir = await realpath(await mkdtemp(join(tmpdir(), 'oauthlint-git-')));
    const git = (...args: string[]) => execa('git', args, { cwd: dir });
    await git('init', '-q', '-b', 'main');
    await git('config', 'user.email', 'test@oauthlint.dev');
    await git('config', 'user.name', 'Test');
    await git('config', 'commit.gpgsign', 'false');
    await writeFile(join(dir, 'base.ts'), 'export const base = 1;\n');
    await git('add', '.');
    await git('commit', '-q', '-m', 'initial');
    return dir;
  }

  it(
    '--staged scans only the staged file, ignoring unstaged/committed ones',
    async () => {
      const repo = await makeRepo();
      try {
        await writeFile(join(repo, 'vuln.ts'), VULN_JWT);
        await writeFile(join(repo, 'unstaged.ts'), VULN_SECRET);
        await execa('git', ['add', 'vuln.ts'], { cwd: repo });

        const { stdout } = await runCli(['scan', '--staged', '--fail-on', 'off', '--json'], {
          cwd: repo,
        });
        const files = basenames(JSON.parse(stdout) as JsonReport);
        expect(files.has('vuln.ts')).toBe(true);
        expect(files.has('unstaged.ts')).toBe(false);
        expect(files.has('base.ts')).toBe(false);
      } finally {
        await rm(repo, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );

  it(
    '--diff <ref> scans only files changed since that ref',
    async () => {
      const repo = await makeRepo();
      try {
        const base = (await execa('git', ['rev-parse', 'HEAD'], { cwd: repo })).stdout.trim();
        await writeFile(join(repo, 'changed.ts'), VULN_JWT);

        const { stdout } = await runCli(['scan', '--diff', base, '--fail-on', 'off', '--json'], {
          cwd: repo,
        });
        const files = basenames(JSON.parse(stdout) as JsonReport);
        expect(files.has('changed.ts')).toBe(true);
        expect(files.has('base.ts')).toBe(false);
      } finally {
        await rm(repo, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );
});

e2e('baseline + scan --baseline', () => {
  it(
    'baselines existing findings, then reports only genuinely NEW ones',
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'oauthlint-baseline-'));
      try {
        await writeFile(join(dir, 'vuln.ts'), VULN_JWT);

        // 1) Record the current state as the baseline.
        const baselined = await runCli(['baseline', '.'], { cwd: dir });
        expect(baselined.exitCode).toBe(0);
        expect(stripAnsi(baselined.stdout)).toMatch(/Baselined \d+ finding/);

        // 2) A clean re-scan reports no NEW findings and exits 0.
        const rescan = await runCli(['scan', '.', '--baseline', '--fail-on', 'HIGH', '--json'], {
          cwd: dir,
        });
        expect(rescan.exitCode).toBe(0);
        expect((JSON.parse(rescan.stdout) as JsonReport).findings).toEqual([]);

        // 3) Introduce a brand-new finding in a new file → only IT surfaces.
        await writeFile(join(dir, 'new.ts'), VULN_SECRET);
        const after = await runCli(['scan', '.', '--baseline', '--fail-on', 'off', '--json'], {
          cwd: dir,
        });
        const report = JSON.parse(after.stdout) as JsonReport;
        const files = basenames(report);
        expect(files.has('new.ts')).toBe(true);
        expect(files.has('vuln.ts')).toBe(false);
        expect(ruleIds(report).has('auth.oauth.hardcoded-secret')).toBe(true);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );
});

// `explain` and `list` read only the bundled rule pack — no Semgrep needed —
// so they run unconditionally and verify the binary boots and wires correctly.
describe('explain', () => {
  it('prints why-it-matters, CWE/OWASP, and vulnerable/safe examples', async () => {
    const { exitCode, stdout } = await runCli(['explain', 'auth.jwt.alg-none']);
    expect(exitCode).toBe(0);
    const out = stripAnsi(stdout);
    expect(out).toContain('auth.jwt.alg-none');
    expect(out).toContain('AUTH-JWT-001');
    expect(out).toContain('CWE-327');
    expect(out).toContain('API2:2023');
    expect(out).toContain('Why this matters');
    expect(out).toContain('Vulnerable');
    expect(out).toContain('jwt.verify');
    expect(out).toContain('Safe');
  });

  it('emits a structured rule object under --json', async () => {
    const { exitCode, stdout } = await runCli(['explain', 'AUTH-JWT-001', '--json']);
    expect(exitCode).toBe(0);
    const rule = JSON.parse(stdout) as { id: string; cwe: string; slug: string };
    expect(rule.id).toBe('auth.jwt.alg-none');
    expect(rule.slug).toBe('jwt-alg-none');
    expect(rule.cwe).toBe('CWE-327');
  });

  it('exits non-zero and guides the user for an unknown rule', async () => {
    const { exitCode, stdout, stderr } = await runCli(['explain', 'auth.does.not-exist']);
    expect(exitCode).not.toBe(0);
    expect(stdout).toBe('');
    expect(stderr).toContain('Unknown rule');
    expect(stderr).toContain('oauthlint list');
  });
});

describe('list', () => {
  it('lists the shipped rules in pretty mode', async () => {
    const { exitCode, stdout } = await runCli(['list']);
    expect(exitCode).toBe(0);
    const out = stripAnsi(stdout);
    expect(out).toContain('OAuthLint');
    expect(out).toContain('auth.jwt.alg-none');
    expect(out).toContain('auth.oauth.hardcoded-secret');
  });

  it('emits a valid JSON array under --json', async () => {
    const { exitCode, stdout } = await runCli(['list', '--json']);
    expect(exitCode).toBe(0);
    const rules = JSON.parse(stdout) as Array<{ id: string }>;
    expect(Array.isArray(rules)).toBe(true);
    expect(rules.length).toBeGreaterThanOrEqual(8);
    expect(rules.every((r) => r.id.startsWith('auth.'))).toBe(true);
  });
});

// A Go cookie with TLS/cookie flags explicitly disabled — fires
// `auth.go.cookie.insecure`, whose autofix flips each flag to its secure value.
const VULN_GO_COOKIE = [
  'package main',
  '',
  'import "net/http"',
  '',
  'func setCookie(w http.ResponseWriter) {',
  '\thttp.SetCookie(w, &http.Cookie{Name: "session", Value: "t", Secure: false, HttpOnly: false})',
  '}',
  '',
].join('\n');

e2e('scan --fix / --fix-dry-run (real autofix)', () => {
  it(
    'previews a unified diff without writing, then applies it, then is idempotent',
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'oauthlint-fix-e2e-'));
      const file = join(dir, 'cookie.go');
      try {
        await writeFile(file, VULN_GO_COOKIE);

        // 1) Dry run: prints a diff, changes nothing on disk. Scan from inside
        // the temp dir so diff labels render as relative paths.
        const dry = await runCli(['scan', '.', '--fix-dry-run', '--fail-on', 'off'], { cwd: dir });
        const dryOut = stripAnsi(dry.stdout);
        expect(dry.exitCode).toBe(0);
        expect(dryOut).toContain('Fix preview');
        expect(dryOut).toContain('--- a/cookie.go');
        expect(dryOut).toContain('+++ b/cookie.go');
        expect(dryOut).toContain('-\thttp.SetCookie(w, &http.Cookie{Name: "session"');
        expect(dryOut).toContain('Secure: true');
        expect(dryOut).toContain('Re-run with --fix');
        // Crucially, the file is untouched.
        expect(await readFile(file, 'utf8')).toBe(VULN_GO_COOKIE);

        // 2) Apply: rewrites the file and prints a summary.
        const fix = await runCli(['scan', '.', '--fix', '--fail-on', 'off'], { cwd: dir });
        const fixOut = stripAnsi(fix.stdout);
        expect(fixOut).toContain('Applied');
        expect(fixOut).toContain('cookie.go');
        const fixed = await readFile(file, 'utf8');
        expect(fixed).toContain('Secure: true');
        expect(fixed).toContain('HttpOnly: true');
        expect(fixed).not.toContain('Secure: false');
        expect(fixed).not.toContain('HttpOnly: false');

        // 3) Idempotent: a second --fix finds nothing and changes nothing.
        const again = await runCli(['scan', '.', '--fix', '--fail-on', 'off'], { cwd: dir });
        expect(stripAnsi(again.stdout)).toContain('No autofixable findings');
        expect(await readFile(file, 'utf8')).toBe(fixed);
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    SCAN_TIMEOUT,
  );
});
