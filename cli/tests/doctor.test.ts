import { describe, expect, it } from 'vitest';
import { runDoctor } from '../src/commands/doctor.js';
import { EngineUnavailableError, type ResolvedEngine } from '../src/engine/index.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

describe('runDoctor', () => {
  it('reports the resolved engine and returns 0 when it resolves', async () => {
    const stream = new FakeStream();
    const engine: ResolvedEngine = {
      path: '/opt/bin/opengrep',
      engine: 'opengrep',
      source: 'path',
    };
    const code = await runDoctor({
      resolve: async () => engine,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    expect(stream.buf).toContain('Node.js runtime');
    expect(stream.buf).toContain('Scan engine');
    expect(stream.buf).toContain('opengrep');
    expect(stream.buf).toContain('found on PATH');
    expect(stream.buf).toContain('/opt/bin/opengrep');
    expect(stream.buf).toContain('OAuthLint rule pack');
  });

  it('returns 1 and reports the failure when no engine can be resolved', async () => {
    const stream = new FakeStream();
    const code = await runDoctor({
      resolve: async () => {
        throw new EngineUnavailableError('no engine and cannot download');
      },
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(1);
    expect(stream.buf).toContain('Scan engine');
    expect(stream.buf).toContain('no engine and cannot download');
  });

  it('emits machine-readable JSON when asked', async () => {
    const stream = new FakeStream();
    await runDoctor({
      json: true,
      resolve: async () => {
        throw new EngineUnavailableError('offline');
      },
      stream: stream as unknown as NodeJS.WritableStream,
    });
    const parsed = JSON.parse(stream.buf) as {
      checks: { name: string; status: string; details: string }[];
    };
    expect(parsed.checks).toHaveLength(3);
    const engine = parsed.checks.find((c) => c.name === 'Scan engine');
    expect(engine?.status).toBe('fail');
  });
});
