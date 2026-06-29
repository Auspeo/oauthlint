import { describe, expect, it } from 'vitest';
import { runScan } from '../src/commands/scan.js';
import { escapeHtml, renderHtmlReport, safeHref } from '../src/formatters/html.js';
import type { Finding, ScanResult } from '../src/types.js';

const baseResult = (findings: Finding[], over: Partial<ScanResult> = {}): ScanResult => ({
  findings,
  scannedFiles: 3,
  durationMs: 100,
  semgrepVersion: '1.163.0',
  errors: [],
  ...over,
});

const finding = (overrides: Partial<Finding> = {}): Finding => ({
  ruleId: 'auth.jwt.alg-none',
  oauthlintRuleId: 'AUTH-JWT-001',
  severity: 'HIGH',
  filePath: 'src/auth/jwt.ts',
  startLine: 14,
  endLine: 14,
  message: 'JWT alg:none accepted.',
  docUrl: 'https://oauthlint.dev/rules/jwt-alg-none',
  ...overrides,
});

// A fixed timestamp keeps the output deterministic and time-independent.
const FIXED_TS = '2026-01-01T00:00:00.000Z';
const render = (result: ScanResult, over = {}): Promise<string> =>
  renderHtmlReport(result, { target: './src', generatedAt: FIXED_TS, ...over });

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<script>&"'</script>`)).toBe(
      '&lt;script&gt;&amp;&quot;&#39;&lt;/script&gt;',
    );
  });

  it('escapes & first so entities are not double-encoded', () => {
    expect(escapeHtml('a & <b>')).toBe('a &amp; &lt;b&gt;');
  });

  it('coerces non-string values', () => {
    expect(escapeHtml(14)).toBe('14');
  });
});

describe('renderHtmlReport — structure', () => {
  it('produces a self-contained HTML document with inlined CSS and no script', async () => {
    const html = await render(baseResult([finding()]));
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('</html>');
    expect(html).toContain('<style>');
    // No external resource requests and no executable script.
    expect(html).not.toMatch(/<script/i);
    expect(html).not.toMatch(/src=["']https?:/i);
    expect(html).not.toMatch(/<link\b/i);
  });

  it('shows the target and the injected (deterministic) timestamp', async () => {
    const html = await render(baseResult([finding()]));
    expect(html).toContain('./src');
    expect(html).toContain(FIXED_TS);
  });

  it('renders the finding details: rule ids, file:line, message, docUrl', async () => {
    const html = await render(baseResult([finding()]));
    expect(html).toContain('auth.jwt.alg-none');
    expect(html).toContain('AUTH-JWT-001');
    expect(html).toContain('src/auth/jwt.ts:14');
    expect(html).toContain('JWT alg:none accepted.');
    expect(html).toContain('https://oauthlint.dev/rules/jwt-alg-none');
  });

  it('renders a per-severity summary with the right counts', async () => {
    const html = await render(
      baseResult([
        finding({ severity: 'HIGH', ruleId: 'a' }),
        finding({ severity: 'HIGH', ruleId: 'b' }),
        finding({ severity: 'HIGH', ruleId: 'c' }),
        finding({ severity: 'MEDIUM', ruleId: 'd' }),
        finding({ severity: 'MEDIUM', ruleId: 'e' }),
        finding({ severity: 'LOW', ruleId: 'f' }),
      ]),
    );
    // 6 total, grouped 3 HIGH / 2 MEDIUM / 1 LOW.
    expect(html).toMatch(/pill total"><span class="n">6<\/span>/);
    expect(html).toMatch(/pill HIGH"><span class="n">3<\/span>/);
    expect(html).toMatch(/pill MEDIUM"><span class="n">2<\/span>/);
    expect(html).toMatch(/pill LOW"><span class="n">1<\/span>/);
  });

  it('groups findings by severity, worst first', async () => {
    const html = await render(
      baseResult([
        finding({ severity: 'LOW', ruleId: 'low.rule' }),
        finding({ severity: 'CRITICAL', ruleId: 'crit.rule' }),
      ]),
    );
    expect(html.indexOf('crit.rule')).toBeLessThan(html.indexOf('low.rule'));
  });

  it('renders a code snippet when one is available', async () => {
    const html = await render(baseResult([finding()]), {
      readSnippet: () => 'const x = jwt.verify(t, k, { algorithms: ["none"] });',
    });
    expect(html).toContain('<pre>');
    expect(html).toContain('algorithms:');
  });

  it('is deterministic for identical inputs', async () => {
    const a = await render(baseResult([finding()]));
    const b = await render(baseResult([finding()]));
    expect(a).toBe(b);
  });
});

describe('renderHtmlReport — empty', () => {
  it('emits a clean "No issues found" report that is still valid HTML', async () => {
    const html = await render(baseResult([]));
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain('No issues found');
    expect(html).not.toContain('class="finding');
  });
});

describe('renderHtmlReport — escaping (injection safety)', () => {
  it('escapes a <script> payload in the message so it cannot execute', async () => {
    const malicious = finding({
      message: '<script>alert(1)</script>',
      ruleId: 'auth.evil."><img src=x onerror=alert(1)>',
    });
    const html = await render(baseResult([malicious]));
    // The raw payload must NOT appear verbatim anywhere in the body.
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    // It must appear escaped instead.
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    // The only <script-ish text in the whole doc is the escaped form.
    expect(html).not.toMatch(/<script/i);
  });

  it('escapes a malicious code snippet read from source', async () => {
    const html = await render(baseResult([finding()]), {
      readSnippet: () => '</style></head><script>steal()</script>',
    });
    expect(html).not.toContain('<script>steal()</script>');
    expect(html).not.toContain('</style></head>');
    expect(html).toContain('&lt;script&gt;steal()&lt;/script&gt;');
  });

  it('escapes a hostile docUrl (no attribute breakout)', async () => {
    const html = await render(
      baseResult([finding({ docUrl: 'https://x/"><script>alert(1)</script>' })]),
    );
    expect(html).not.toContain('"><script>alert(1)</script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('does NOT render a javascript: docUrl as a live href', async () => {
    const html = await render(
      baseResult([finding({ docUrl: 'javascript:alert(document.cookie)' })]),
    );
    // No anchor pointing at the scheme is emitted, in any escaped form.
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toContain('javascript:alert');
    // The doc paragraph (and its 📖 marker) is omitted entirely for unsafe URLs.
    expect(html).not.toContain('class="doc"');
  });

  it('does not render other dangerous schemes (data:) as a live href', async () => {
    const html = await render(
      baseResult([finding({ docUrl: 'data:text/html,<script>alert(1)</script>' })]),
    );
    expect(html).not.toMatch(/href="data:/i);
    expect(html).not.toContain('class="doc"');
  });
});

describe('safeHref', () => {
  it('passes through http(s) URLs unchanged', () => {
    expect(safeHref('https://oauthlint.dev/rules/x')).toBe('https://oauthlint.dev/rules/x');
    expect(safeHref('http://example.test')).toBe('http://example.test');
  });

  it('rejects javascript:, data:, and other non-http(s) schemes', () => {
    expect(safeHref('javascript:alert(1)')).toBeNull();
    expect(safeHref('data:text/html,x')).toBeNull();
    expect(safeHref('vbscript:msgbox(1)')).toBeNull();
    expect(safeHref('  https://leading-space.test')).toBeNull();
    expect(safeHref(undefined)).toBeNull();
  });
});

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

function fakeAdapter(findings: Finding[]): import('../src/adapters/semgrep.js').SemgrepAdapter {
  return {
    async scan(): Promise<ScanResult> {
      return baseResult(findings, { scannedFiles: 5 });
    },
    async getVersion() {
      return '1.0.0';
    },
  } as unknown as import('../src/adapters/semgrep.js').SemgrepAdapter;
}

describe('runScan (HTML format)', () => {
  it('emits an HTML document to the stream and does not throw', async () => {
    const stream = new FakeStream();
    const code = await runScan({
      path: '.',
      format: 'html',
      failOn: 'off',
      adapter: fakeAdapter([finding({ severity: 'HIGH' })]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(stream.buf).toMatch(/^<!DOCTYPE html>/);
    expect(stream.buf).toContain('auth.jwt.alg-none');
  });

  it('emits a valid empty HTML report when there are no findings', async () => {
    const stream = new FakeStream();
    await runScan({
      path: '.',
      format: 'html',
      failOn: 'off',
      adapter: fakeAdapter([]),
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(stream.buf).toMatch(/^<!DOCTYPE html>/);
    expect(stream.buf).toContain('No issues found');
  });
});
