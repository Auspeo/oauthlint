import { describe, expect, it } from 'vitest';
import { runList } from '../src/commands/list.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

describe('runList', () => {
  it('lists every shipped rule in pretty mode', async () => {
    const stream = new FakeStream();
    const code = await runList({ stream: stream as unknown as NodeJS.WritableStream });
    expect(code).toBe(0);
    expect(stream.buf).toContain('OAuthLint');
    expect(stream.buf).toContain('auth.jwt.alg-none');
    expect(stream.buf).toContain('auth.oauth.hardcoded-secret');
  });

  it('emits a JSON array in JSON mode', async () => {
    const stream = new FakeStream();
    await runList({ json: true, stream: stream as unknown as NodeJS.WritableStream });
    const parsed = JSON.parse(stream.buf) as Array<{ id: string }>;
    expect(parsed.length).toBeGreaterThanOrEqual(8);
    expect(parsed.every((r) => r.id.startsWith('auth.'))).toBe(true);
  });
});
