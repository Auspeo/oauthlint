import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { OpengrepLspEngine, type SpawnFn } from '../src/lspEngine.js';

/** A fake `opengrep lsp` child: captures stdin writes, lets tests push stdout. */
function fakeChild() {
  const stdinWrites: string[] = [];
  const stdout = new EventEmitter();
  const child = new EventEmitter() as unknown as {
    stdin: { write: (s: string) => void };
    stdout: EventEmitter;
    kill: () => void;
    emit: (e: string) => void;
  };
  child.stdin = { write: (s: string) => void stdinWrites.push(s) };
  child.stdout = stdout;
  child.kill = vi.fn();
  /** Frame a server->client message the way the LSP wire protocol does. */
  const push = (msg: unknown) => {
    const body = JSON.stringify(msg);
    stdout.emit('data', Buffer.from(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`));
  };
  /** Parse the JSON bodies the engine wrote to stdin. */
  const sent = () =>
    stdinWrites.map(
      (w) => JSON.parse(w.slice(w.indexOf('\r\n\r\n') + 4)) as Record<string, unknown>,
    );
  return { child, push, sent };
}

function makeEngine(fake: ReturnType<typeof fakeChild>) {
  const spawn = vi.fn(() => fake.child) as unknown as SpawnFn;
  return new OpengrepLspEngine({
    binary: '/fake/opengrep',
    rulesRoot: '/rules',
    rootUri: 'file:///ws',
    spawn,
    scanTimeoutMs: 50,
  });
}

/** Drive the engine to the ready state. */
function boot(fake: ReturnType<typeof fakeChild>, engine: OpengrepLspEngine) {
  engine.start();
  fake.push({ jsonrpc: '2.0', id: 1, result: { capabilities: {} } }); // initialize response
  fake.push({ jsonrpc: '2.0', method: 'semgrep/rulesRefreshed', params: {} }); // ready
}

const diag = (code: string) => ({
  code,
  message: `finding ${code}`,
  severity: 1,
  range: { start: { line: 2, character: 0 }, end: { line: 2, character: 10 } },
});

describe('OpengrepLspEngine', () => {
  it('sends initialize with the rules config and acks initialized', () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    engine.start();
    const init = fake.sent()[0];
    expect(init.method).toBe('initialize');
    expect((init.params as any).initializationOptions.scan.configuration).toEqual(['/rules']);
    fake.push({ jsonrpc: '2.0', id: 1, result: { capabilities: {} } });
    expect(fake.sent().some((m) => m.method === 'initialized')).toBe(true);
  });

  it('becomes ready on semgrep/rulesRefreshed', async () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    engine.start();
    expect(engine.isReady()).toBe(false);
    fake.push({ jsonrpc: '2.0', method: 'semgrep/rulesRefreshed', params: {} });
    await engine.whenReady();
    expect(engine.isReady()).toBe(true);
  });

  it('scans a new document with didOpen and resolves its diagnostics', async () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    boot(fake, engine);
    const uri = 'file:///ws/a.ts';
    const p = engine.scanDocument(uri, 'typescript', 'code');
    // didOpen was sent for a first-seen document
    const didOpen = fake.sent().find((m) => m.method === 'textDocument/didOpen');
    expect(didOpen).toBeTruthy();
    fake.push({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, diagnostics: [diag('auth.jwt.no-audience')] },
    });
    const result = await p;
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('auth.jwt.no-audience');
  });

  it('re-scans an already-open document with didChange + didSave', async () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    boot(fake, engine);
    const uri = 'file:///ws/a.ts';
    const first = engine.scanDocument(uri, 'typescript', 'v1');
    fake.push({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, diagnostics: [] },
    });
    await first;
    const before = fake.sent().length;
    const second = engine.scanDocument(uri, 'typescript', 'v2');
    const after = fake
      .sent()
      .slice(before)
      .map((m) => m.method);
    expect(after).toContain('textDocument/didChange');
    expect(after).toContain('textDocument/didSave');
    expect(after).not.toContain('textDocument/didOpen');
    fake.push({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, diagnostics: [diag('x')] },
    });
    expect(await second).toHaveLength(1);
  });

  it('supersedes an in-flight scan for the same uri (only the latest resolves real results)', async () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    boot(fake, engine);
    const uri = 'file:///ws/a.ts';
    const stale = engine.scanDocument(uri, 'typescript', 'v1');
    const fresh = engine.scanDocument(uri, 'typescript', 'v2'); // supersedes stale
    fake.push({
      jsonrpc: '2.0',
      method: 'textDocument/publishDiagnostics',
      params: { uri, diagnostics: [diag('y')] },
    });
    expect(await stale).toEqual([]); // stale resolved empty
    expect(await fresh).toHaveLength(1);
  });

  it('resolves empty on scan timeout', async () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    boot(fake, engine);
    const result = await engine.scanDocument('file:///ws/b.ts', 'typescript', 'code'); // no diagnostics pushed
    expect(result).toEqual([]);
  });

  it('resolves empty and does not hang after the process exits', async () => {
    const fake = fakeChild();
    const engine = makeEngine(fake);
    boot(fake, engine);
    (fake.child as unknown as EventEmitter).emit('exit');
    const result = await engine.scanDocument('file:///ws/c.ts', 'typescript', 'code');
    expect(result).toEqual([]);
  });
});
