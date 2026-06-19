import { describe, expect, it } from 'vitest';
import { runDoctor } from '../src/commands/doctor.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

describe('runDoctor', () => {
  it('runs all 3 checks and returns 1 when Semgrep is missing', async () => {
    const stream = new FakeStream();
    const code = await runDoctor({
      binary: '/definitely/not/a/real/semgrep',
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(1);
    expect(stream.buf).toContain('Node.js runtime');
    expect(stream.buf).toContain('Semgrep CLI');
    expect(stream.buf).toContain('OAuthLint rule pack');
    expect(stream.buf).toContain('not found on PATH');
  });

  it('emits machine-readable JSON when asked', async () => {
    const stream = new FakeStream();
    await runDoctor({
      binary: '/definitely/not/a/real/semgrep',
      json: true,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    const parsed = JSON.parse(stream.buf) as {
      checks: { name: string; status: string; details: string }[];
    };
    expect(parsed.checks).toHaveLength(3);
    const semgrep = parsed.checks.find((c) => c.name === 'Semgrep CLI');
    expect(semgrep?.status).toBe('fail');
  });
});
