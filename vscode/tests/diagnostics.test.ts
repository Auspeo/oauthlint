import { describe, expect, it } from 'vitest';
import { type DiagnosticSink, applyScanDiagnostics } from '../src/diagnostics.js';

/**
 * `applyScanDiagnostics` carries the squiggle-publishing rules without pulling
 * in the `vscode` module. We back it with a tiny in-memory sink that behaves
 * like `vscode.DiagnosticCollection` (URIs keyed by string), then assert the
 * stale-removal behaviour for each scope — including the save-within-debounce
 * race that motivated the fix.
 */

type Diag = { id: string };

class FakeSink implements DiagnosticSink<string, Diag> {
  readonly store = new Map<string, Diag[]>();
  readonly calls: string[] = [];

  clear(): void {
    this.calls.push('clear');
    this.store.clear();
  }
  delete(uri: string): void {
    this.calls.push(`delete:${uri}`);
    this.store.delete(uri);
  }
  set(uri: string, diagnostics: Diag[]): void {
    this.calls.push(`set:${uri}`);
    this.store.set(uri, diagnostics);
  }
}

const identityUri = (filePath: string) => filePath;

describe('applyScanDiagnostics — file scope', () => {
  it('deletes only the scanned file before re-applying, never clearing', () => {
    const sink = new FakeSink();
    applyScanDiagnostics(sink, {
      scope: 'file',
      scannedUri: '/a.ts',
      byFile: new Map([['/a.ts', [{ id: 'a1' }]]]),
      toUri: identityUri,
    });
    expect(sink.calls).toEqual(['delete:/a.ts', 'set:/a.ts']);
    expect(sink.store.get('/a.ts')).toEqual([{ id: 'a1' }]);
  });

  it('does not clobber another file scanned within the debounce window', () => {
    const sink = new FakeSink();
    // File B's scan finishes first and publishes.
    applyScanDiagnostics(sink, {
      scope: 'file',
      scannedUri: '/b.ts',
      byFile: new Map([['/b.ts', [{ id: 'b1' }]]]),
      toUri: identityUri,
    });
    // File A's scan finishes next — it must leave B's diagnostics intact.
    applyScanDiagnostics(sink, {
      scope: 'file',
      scannedUri: '/a.ts',
      byFile: new Map([['/a.ts', [{ id: 'a1' }]]]),
      toUri: identityUri,
    });
    expect(sink.store.get('/b.ts')).toEqual([{ id: 'b1' }]);
    expect(sink.store.get('/a.ts')).toEqual([{ id: 'a1' }]);
  });

  it('removes stale diagnostics when the scanned file now has no findings', () => {
    const sink = new FakeSink();
    sink.store.set('/a.ts', [{ id: 'stale' }]);
    applyScanDiagnostics(sink, {
      scope: 'file',
      scannedUri: '/a.ts',
      byFile: new Map(),
      toUri: identityUri,
    });
    expect(sink.calls).toEqual(['delete:/a.ts']);
    expect(sink.store.has('/a.ts')).toBe(false);
  });
});

describe('applyScanDiagnostics — workspace scope', () => {
  it('clears the whole collection before publishing the fresh set', () => {
    const sink = new FakeSink();
    sink.store.set('/old.ts', [{ id: 'old' }]);
    applyScanDiagnostics(sink, {
      scope: 'workspace',
      scannedUri: '/workspace',
      byFile: new Map([
        ['/a.ts', [{ id: 'a1' }]],
        ['/b.ts', [{ id: 'b1' }]],
      ]),
      toUri: identityUri,
    });
    expect(sink.calls).toEqual(['clear', 'set:/a.ts', 'set:/b.ts']);
    expect(sink.store.has('/old.ts')).toBe(false);
    expect(sink.store.get('/a.ts')).toEqual([{ id: 'a1' }]);
  });
});
