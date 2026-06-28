import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock execa with a plain swappable function (no vi.fn spy): the adapter's
// error paths reject, and the spy's internal result-tracking would otherwise
// leave those rejections "unhandled" and fail the test. A bare function keeps
// the control flow entirely inside the adapter's own try/catch.
const state = vi.hoisted(() => ({
  impl: (..._args: unknown[]): unknown => undefined,
  calls: [] as unknown[][],
}));
vi.mock('execa', () => ({
  execa: (...args: unknown[]) => {
    state.calls.push(args);
    return state.impl(...args);
  },
  ExecaError: class ExecaError extends Error {},
}));

import {
  SemgrepAdapter,
  SemgrepNotInstalledError,
  SemgrepOutputError,
} from '../src/adapters/semgrep.js';

/** Make the next execa call resolve with `value`. */
const resolveWith = (value: unknown) => {
  state.impl = async () => value;
};
/** Make the next execa call throw `value` synchronously (caught by the adapter). */
const throwWith = (value: unknown) => {
  state.impl = () => {
    throw value;
  };
};

const semgrepResult = (overrides: Record<string, unknown> = {}) => ({
  check_id: 'packages.oauthlint-rules.rules.jwt.auth.jwt.alg-none',
  path: 'src/server.ts',
  start: { line: 14 },
  end: { line: 14 },
  extra: {
    severity: 'ERROR',
    message: '  JWT alg:none accepted.  ',
    metadata: {
      'oauthlint-rule-id': 'AUTH-JWT-001',
      'oauthlint-doc-url': 'https://oauthlint.dev/rules/jwt-alg-none',
      cwe: 'CWE-327',
      'llm-prevalence': 'HIGH',
    },
  },
  ...overrides,
});

beforeEach(() => {
  state.impl = async () => ({ stdout: '{}' });
  state.calls = [];
});
afterEach(() => vi.clearAllMocks());

describe('SemgrepAdapter.scan (mocked execa)', () => {
  it('maps a semgrep result into a normalised finding', async () => {
    resolveWith({
      stdout: JSON.stringify({
        version: '1.99.0',
        results: [semgrepResult()],
        paths: { scanned: ['a.ts', 'b.ts'] },
      }),
    });

    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    const result = await adapter.scan('/target');

    expect(result.semgrepVersion).toBe('1.99.0');
    expect(result.scannedFiles).toBe(2);
    expect(result.findings).toHaveLength(1);
    const f = result.findings[0];
    expect(f.ruleId).toBe('auth.jwt.alg-none'); // path prefix stripped
    expect(f.oauthlintRuleId).toBe('AUTH-JWT-001');
    expect(f.severity).toBe('HIGH'); // ERROR → HIGH via SEMGREP_SEVERITY_MAP
    expect(f.cwe).toBe('CWE-327');
    expect(f.docUrl).toBe('https://oauthlint.dev/rules/jwt-alg-none');
    expect(f.llmPrevalence).toBe('HIGH');
    expect(f.message).toBe('JWT alg:none accepted.'); // trimmed
  });

  it('defaults severity to MEDIUM for unknown semgrep severities', async () => {
    resolveWith({
      stdout: JSON.stringify({
        results: [semgrepResult({ extra: { severity: 'WEIRD', message: 'x', metadata: {} } })],
      }),
    });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    const result = await adapter.scan('/target');
    expect(result.findings[0].severity).toBe('MEDIUM');
  });

  it('passes --autofix when applyFixes is set', async () => {
    resolveWith({ stdout: '{}' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await adapter.scan('/target', { applyFixes: true });
    const [, args] = state.calls[0] as [string, string[]];
    expect(args).toContain('--autofix');
  });

  it('throws SemgrepOutputError when stdout is non-empty but unparseable', async () => {
    // Regression guard: this used to be swallowed as "0 findings, exit 0",
    // which made a truncated/interrupted scan look clean in CI.
    resolveWith({ stdout: 'not json at all' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.scan('/target')).rejects.toBeInstanceOf(SemgrepOutputError);
  });

  it('treats empty stdout as a clean zero-finding scan', async () => {
    resolveWith({ stdout: '   ' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    const result = await adapter.scan('/target');
    expect(result.findings).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('surfaces semgrep-reported errors', async () => {
    resolveWith({
      stdout: JSON.stringify({
        results: [],
        errors: [{ long_msg: 'long boom' }, { message: 'short boom' }, {}],
      }),
    });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    const result = await adapter.scan('/target');
    expect(result.errors).toEqual(['long boom', 'short boom', 'unknown semgrep error']);
  });

  it('throws SemgrepNotInstalledError when execa rejects with ENOENT', async () => {
    throwWith({ code: 'ENOENT' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.scan('/target')).rejects.toBeInstanceOf(SemgrepNotInstalledError);
  });

  it('throws SemgrepNotInstalledError when the result object reports ENOENT', async () => {
    resolveWith({ failed: true, code: 'ENOENT', stdout: '' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.scan('/target')).rejects.toBeInstanceOf(SemgrepNotInstalledError);
  });

  it('detects ENOENT nested under cause', async () => {
    throwWith({ cause: { code: 'ENOENT' } });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.scan('/target')).rejects.toBeInstanceOf(SemgrepNotInstalledError);
  });

  it('re-throws unexpected (non-spawn) errors', async () => {
    throwWith(new Error('disk on fire'));
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.scan('/target')).rejects.toThrow('disk on fire');
  });
});

describe('SemgrepAdapter.planFixes (mocked execa)', () => {
  // A fix result carries the replacement text plus the byte range it covers.
  const fixResult = (path: string, start: number, end: number, fix: string) => ({
    check_id: 'rules.tls.auth.tls.reject-unauthorized',
    path,
    start: { line: 1, offset: start },
    end: { line: 1, offset: end },
    extra: { severity: 'ERROR', message: 'x', fix, metadata: {} },
  });

  it('runs --autofix --dryrun and reconstructs the fixed file from offsets', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'oauthlint-plan-'));
    try {
      const file = join(dir, 'agent.ts');
      const content = 'const x = { rejectUnauthorized: false };\n';
      writeFileSync(file, content);
      const start = content.indexOf('false');
      const end = start + 'false'.length;

      resolveWith({
        stdout: JSON.stringify({ results: [fixResult(file, start, end, 'true')] }),
      });
      const adapter = new SemgrepAdapter({ configPath: '/rules' });
      const plan = await adapter.planFixes(file);

      // The dry run must request both flags (so nothing is written to disk).
      const [, args] = state.calls[0] as [string, string[]];
      expect(args).toContain('--autofix');
      expect(args).toContain('--dryrun');

      expect(plan.totalFixes).toBe(1);
      expect(plan.files).toHaveLength(1);
      expect(plan.files[0].path).toBe(file);
      expect(plan.files[0].original).toBe(content);
      expect(plan.files[0].fixed).toBe('const x = { rejectUnauthorized: true };\n');
      expect(plan.files[0].fixCount).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('applies multiple fixes in one file from the end backwards', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'oauthlint-plan-'));
    try {
      const file = join(dir, 'multi.go');
      const content = 'a{Secure: false, HttpOnly: false}\n';
      writeFileSync(file, content);
      const s1 = content.indexOf('false');
      const s2 = content.indexOf('false', s1 + 1);
      resolveWith({
        stdout: JSON.stringify({
          results: [fixResult(file, s1, s1 + 5, 'true'), fixResult(file, s2, s2 + 5, 'true')],
        }),
      });
      const adapter = new SemgrepAdapter({ configPath: '/rules' });
      const plan = await adapter.planFixes(file);
      expect(plan.files[0].fixed).toBe('a{Secure: true, HttpOnly: true}\n');
      expect(plan.files[0].fixCount).toBe(2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignores results without a fix and yields an empty plan', async () => {
    resolveWith({
      stdout: JSON.stringify({
        results: [{ check_id: 'r', path: '/x', start: { line: 1 }, end: { line: 1 }, extra: {} }],
      }),
    });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    const plan = await adapter.planFixes('/x');
    expect(plan.files).toEqual([]);
    expect(plan.totalFixes).toBe(0);
  });

  it('skips a fix whose target file cannot be read', async () => {
    resolveWith({
      stdout: JSON.stringify({
        results: [fixResult('/no/such/file.ts', 0, 1, 'y')],
      }),
    });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    const plan = await adapter.planFixes('/no/such/file.ts');
    expect(plan.files).toEqual([]);
  });

  it('throws SemgrepNotInstalledError when the binary is missing', async () => {
    throwWith({ code: 'ENOENT' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.planFixes('/target')).rejects.toBeInstanceOf(SemgrepNotInstalledError);
  });
});

describe('SemgrepAdapter.getVersion (mocked execa)', () => {
  it('returns the trimmed version string', async () => {
    resolveWith({ stdout: ' 1.99.0\n' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    expect(await adapter.getVersion()).toBe('1.99.0');
  });

  it('returns null for empty output', async () => {
    resolveWith({ stdout: '   ' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    expect(await adapter.getVersion()).toBeNull();
  });

  it('returns null when the binary is missing (ENOENT)', async () => {
    throwWith({ code: 'ENOENT' });
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    expect(await adapter.getVersion()).toBeNull();
  });

  it('re-throws unexpected errors', async () => {
    throwWith(new Error('kaboom'));
    const adapter = new SemgrepAdapter({ configPath: '/rules' });
    await expect(adapter.getVersion()).rejects.toThrow('kaboom');
  });
});
