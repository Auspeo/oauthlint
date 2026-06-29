/**
 * Pure diagnostics-publishing logic, kept free of the `vscode` module so it can
 * be unit-tested. The VS Code layer wires a real `DiagnosticCollection` and the
 * `vscode.Uri` factory in; here we only model the behaviour that matters for
 * correctness — which stale entries get removed before fresh ones are applied.
 */

/** The minimal slice of `vscode.DiagnosticCollection` this logic touches. */
export interface DiagnosticSink<TUri, TDiagnostic> {
  /** Remove every entry in the collection. */
  clear(): void;
  /** Remove the entry for a single URI. */
  delete(uri: TUri): void;
  /** Replace the diagnostics for a single URI. */
  set(uri: TUri, diagnostics: TDiagnostic[]): void;
}

/**
 * Whether a scan covered a single file or a whole workspace folder. The scope
 * decides how aggressively stale diagnostics are pruned.
 */
export type ScanScope = 'file' | 'workspace';

export interface ApplyScanOptions<TUri, TDiagnostic> {
  scope: ScanScope;
  /** The URI that was scanned (a file for `'file'`, a folder for `'workspace'`). */
  scannedUri: TUri;
  /** Fresh diagnostics grouped by absolute file path. */
  byFile: Map<string, TDiagnostic[]>;
  /** Build a URI from a finding's file path (e.g. `vscode.Uri.file`). */
  toUri: (filePath: string) => TUri;
}

/**
 * Remove the previous scan's diagnostics and publish the fresh ones.
 *
 * - `'file'`: only the scanned file's diagnostics are dropped (`delete`). A
 *   full `clear()` here would wipe every other file's squiggles, so two saves
 *   landing inside the debounce window would race — the first scan finishing
 *   would erase the second's results. Scoping the removal to the one file we
 *   re-publish keeps concurrent single-file scans independent.
 * - `'workspace'`: a full refresh is intended, so the whole collection is
 *   cleared before the fresh set is applied.
 *
 * Stale diagnostics for the scanned file are always removed first, so a file
 * that no longer has findings ends up with no squiggles even though `byFile`
 * carries no entry for it.
 */
export function applyScanDiagnostics<TUri, TDiagnostic>(
  sink: DiagnosticSink<TUri, TDiagnostic>,
  options: ApplyScanOptions<TUri, TDiagnostic>,
): void {
  if (options.scope === 'workspace') {
    sink.clear();
  } else {
    sink.delete(options.scannedUri);
  }
  for (const [filePath, diags] of options.byFile) {
    sink.set(options.toUri(filePath), diags);
  }
}
