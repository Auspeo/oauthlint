/**
 * Resident Opengrep LSP scan backend.
 *
 * The CLI spawns the engine per scan, which pays ~4s of rule compilation every
 * time. For live, as-you-type linting we instead keep ONE `opengrep lsp` process
 * alive: it compiles the 275-rule pack once, then scans the in-memory buffer on
 * each edit in ~10-20ms. This module owns that process and exposes a single
 * `scanDocument()` call; it is deliberately free of the `vscode` runtime so the
 * framing, readiness, and correlation logic can be unit-tested with a fake child.
 *
 * Protocol (verified against Opengrep 1.25 `opengrep lsp`):
 *  - initialize with `initializationOptions.scan.configuration = [rulesRoot]`,
 *    then `initialized`.
 *  - the pack is ready when the server sends the `semgrep/rulesRefreshed`
 *    notification (a fallback timer covers the rare case it never arrives).
 *  - a document is scanned by `didOpen` the first time, and thereafter by a
 *    `didChange` (to keep the server's model in sync) followed by a `didSave`
 *    carrying the current text (the save is what actually triggers a re-scan;
 *    `didChange` alone does not, the server uses incremental sync).
 *  - results arrive as a `textDocument/publishDiagnostics` notification whose
 *    `code` is the OAuthLint rule id.
 */
import type { ChildProcessWithoutNullStreams } from 'node:child_process';

/** Minimal shape of a spawn function, injectable so tests pass a fake child. */
export type SpawnFn = (
  command: string,
  args: string[],
  options: { env: NodeJS.ProcessEnv; stdio: ['pipe', 'pipe', 'ignore' | 'pipe'] },
) => ChildProcessWithoutNullStreams;

/** An LSP diagnostic as Opengrep emits it (only the fields we consume). */
export interface LspDiagnostic {
  code?: string | number;
  message: string;
  source?: string;
  severity?: number; // 1 Error, 2 Warning, 3 Information, 4 Hint
  range: {
    start: { line: number; character: number };
    end: { line: number; character: number };
  };
}

export interface LspEngineOptions {
  /** Absolute path to the opengrep binary. */
  binary: string;
  /** Absolute path to the rules root passed to the LSP once, on initialize. */
  rulesRoot: string;
  /** Workspace root URI (file://...). */
  rootUri: string;
  /** Injected spawn (defaults to node:child_process spawn). */
  spawn: SpawnFn;
  /** Per-scan timeout in ms before resolving empty (default 5000). */
  scanTimeoutMs?: number;
  /** Readiness fallback in ms if `semgrep/rulesRefreshed` never arrives (default 30000). */
  readyTimeoutMs?: number;
  /** Optional log sink for diagnostics/telemetry. */
  log?: (message: string) => void;
}

interface Pending {
  resolve: (d: LspDiagnostic[]) => void;
  timer: ReturnType<typeof setTimeout>;
}

const ENGINE_ENV: NodeJS.ProcessEnv = { PYTHONUTF8: '1', LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8' };

export class OpengrepLspEngine {
  private child: ChildProcessWithoutNullStreams | undefined;
  private buf = Buffer.alloc(0);
  private nextId = 1;
  private ready = false;
  private crashed = false;
  private readonly opened = new Set<string>();
  private readonly pending = new Map<string, Pending>();
  private readyWaiters: Array<() => void> = [];
  private readyTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly opts: LspEngineOptions) {}

  /** Spawn the LSP process and send `initialize`. Idempotent. */
  start(): void {
    if (this.child) return;
    this.crashed = false;
    const child = this.opts.spawn(this.opts.binary, ['lsp'], {
      env: { ...process.env, ...ENGINE_ENV },
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    this.child = child;
    child.stdout.on('data', (d: Buffer) => this.onData(d));
    child.on('exit', () => this.onExit());
    child.on('error', () => this.onExit());

    this.readyTimer = setTimeout(() => this.markReady(), this.opts.readyTimeoutMs ?? 30_000);
    this.send({
      jsonrpc: '2.0',
      id: this.nextId++,
      method: 'initialize',
      params: {
        processId: process.pid,
        rootUri: this.opts.rootUri,
        workspaceFolders: [{ uri: this.opts.rootUri, name: 'oauthlint' }],
        capabilities: { textDocument: { publishDiagnostics: {} } },
        initializationOptions: {
          scan: { configuration: [this.opts.rulesRoot], onlyGitDirty: false },
        },
      },
    });
  }

  /** Terminate the process and reject everything in flight. */
  stop(): void {
    if (this.readyTimer) clearTimeout(this.readyTimer);
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.resolve([]);
    }
    this.pending.clear();
    this.opened.clear();
    this.ready = false;
    const child = this.child;
    this.child = undefined;
    if (child) {
      try {
        child.kill();
      } catch {
        /* already gone */
      }
    }
  }

  /** True once the rule pack has compiled and scans will return real results. */
  isReady(): boolean {
    return this.ready;
  }

  /** Resolves when the pack is compiled (or the readiness fallback fires). */
  whenReady(): Promise<void> {
    if (this.ready) return Promise.resolve();
    return new Promise((resolve) => this.readyWaiters.push(resolve));
  }

  /**
   * Scan the given in-memory buffer and resolve with its diagnostics. A newer
   * scan for the same uri supersedes an older in-flight one (the stale pending
   * resolves empty), so only the latest keystroke's result is delivered.
   */
  scanDocument(uri: string, languageId: string, text: string): Promise<LspDiagnostic[]> {
    if (this.crashed || !this.child) return Promise.resolve([]);

    // Supersede any in-flight scan for this uri: only the latest keystroke's
    // result should be delivered, the stale one resolves empty.
    const inflight = this.pending.get(uri);
    if (inflight) {
      clearTimeout(inflight.timer);
      inflight.resolve([]);
      this.pending.delete(uri);
    }

    let resolveResult!: (d: LspDiagnostic[]) => void;
    const result = new Promise<LspDiagnostic[]>((resolve) => {
      resolveResult = resolve;
    });
    const timer = setTimeout(() => {
      this.pending.delete(uri);
      resolveResult([]);
    }, this.opts.scanTimeoutMs ?? 5000);
    this.pending.set(uri, { resolve: resolveResult, timer });

    const dispatch = () => {
      if (this.crashed || !this.child) {
        const p = this.pending.get(uri);
        if (p && p.resolve === resolveResult) {
          clearTimeout(p.timer);
          this.pending.delete(uri);
          p.resolve([]);
        }
        return;
      }
      if (!this.opened.has(uri)) {
        this.opened.add(uri);
        this.send({
          jsonrpc: '2.0',
          method: 'textDocument/didOpen',
          params: { textDocument: { uri, languageId, version: 1, text } },
        });
      } else {
        this.send({
          jsonrpc: '2.0',
          method: 'textDocument/didChange',
          params: { textDocument: { uri, version: this.nextId++ }, contentChanges: [{ text }] },
        });
        // The save is the actual scan trigger; it carries the current buffer text.
        this.send({
          jsonrpc: '2.0',
          method: 'textDocument/didSave',
          params: { textDocument: { uri }, text },
        });
      }
    };

    // Send synchronously when the pack is ready (so the trigger and its pending
    // registration happen in the same tick); otherwise wait for readiness.
    if (this.ready) dispatch();
    else void this.whenReady().then(dispatch);

    return result;
  }

  // --- internals ---

  private send(message: unknown): void {
    const child = this.child;
    if (!child) return;
    const body = JSON.stringify(message);
    child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
  }

  /** Frame and dispatch LSP messages from the server's stdout. */
  private onData(chunk: Buffer): void {
    this.buf = Buffer.concat([this.buf, chunk]);
    for (;;) {
      const headerEnd = this.buf.indexOf('\r\n\r\n');
      if (headerEnd < 0) break;
      const header = this.buf.subarray(0, headerEnd).toString('ascii');
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        // Malformed header, drop it and resync.
        this.buf = this.buf.subarray(headerEnd + 4);
        continue;
      }
      const length = Number(match[1]);
      const bodyStart = headerEnd + 4;
      if (this.buf.length < bodyStart + length) break; // wait for more
      const body = this.buf.subarray(bodyStart, bodyStart + length).toString('utf8');
      this.buf = this.buf.subarray(bodyStart + length);
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(body) as Record<string, unknown>;
      } catch {
        continue;
      }
      this.handle(msg);
    }
  }

  private handle(msg: Record<string, unknown>): void {
    const method = msg.method as string | undefined;
    // initialize response -> ack with `initialized`
    if (msg.id === 1 && msg.result && typeof msg.result === 'object') {
      this.send({ jsonrpc: '2.0', method: 'initialized', params: {} });
      return;
    }
    if (method === 'semgrep/rulesRefreshed') {
      this.markReady();
      return;
    }
    if (method === 'textDocument/publishDiagnostics') {
      const params = msg.params as { uri: string; diagnostics: LspDiagnostic[] } | undefined;
      if (!params) return;
      const p = this.pending.get(params.uri);
      if (p) {
        clearTimeout(p.timer);
        this.pending.delete(params.uri);
        p.resolve(params.diagnostics ?? []);
      }
    }
  }

  private markReady(): void {
    if (this.ready) return;
    this.ready = true;
    if (this.readyTimer) clearTimeout(this.readyTimer);
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const w of waiters) w();
  }

  private onExit(): void {
    this.crashed = true;
    if (this.readyTimer) clearTimeout(this.readyTimer);
    for (const [, p] of this.pending) {
      clearTimeout(p.timer);
      p.resolve([]);
    }
    this.pending.clear();
    this.opened.clear();
    this.ready = false;
    // Unblock any whenReady() waiters so callers fall back rather than hang.
    const waiters = this.readyWaiters;
    this.readyWaiters = [];
    for (const w of waiters) w();
    this.child = undefined;
    this.opts.log?.('opengrep lsp process exited');
  }
}
