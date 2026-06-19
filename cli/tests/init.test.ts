import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { __TEMPLATE, runInit } from '../src/commands/init.js';

class FakeStream {
  buf = '';
  write(chunk: string | Uint8Array): boolean {
    this.buf += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString('utf8');
    return true;
  }
}

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'oauthlint-init-'));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('runInit', () => {
  it('writes a default .oauthlintrc.yml when none exists', async () => {
    const stream = new FakeStream();
    const code = await runInit({
      cwd: dir,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    const content = await readFile(join(dir, '.oauthlintrc.yml'), 'utf8');
    expect(content).toBe(__TEMPLATE);
    expect(stream.buf).toContain('Wrote');
  });

  it('refuses to overwrite an existing config without --force', async () => {
    await writeFile(join(dir, '.oauthlintrc.yml'), '# pre-existing', 'utf8');
    const stream = new FakeStream();
    const code = await runInit({
      cwd: dir,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(1);
    const content = await readFile(join(dir, '.oauthlintrc.yml'), 'utf8');
    expect(content).toBe('# pre-existing');
    expect(stream.buf).toContain('already exists');
  });

  it('overwrites when --force is set', async () => {
    await writeFile(join(dir, '.oauthlintrc.yml'), '# stale', 'utf8');
    const stream = new FakeStream();
    const code = await runInit({
      cwd: dir,
      force: true,
      stream: stream as unknown as NodeJS.WritableStream,
    });
    expect(code).toBe(0);
    const content = await readFile(join(dir, '.oauthlintrc.yml'), 'utf8');
    expect(content).toBe(__TEMPLATE);
  });
});
