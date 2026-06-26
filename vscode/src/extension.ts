import { dirname, resolve } from 'node:path';
import * as vscode from 'vscode';
import { type OAuthLintFinding, filterBySeverity, runOAuthLint } from './runner.js';
import { type StatusBarState, computeStatusBar } from './statusbar.js';
import { buildDisableNextLineDirective, leadingIndent } from './suppressions.js';

const DIAG_SOURCE = 'oauthlint';
const SCAN_DEBOUNCE_MS = 600;

/** Languages the extension scans — mirrors the activationEvents + code-action selectors. */
const SUPPORTED_LANGUAGES = new Set([
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
]);

// Warn once per session if the CLI can't be spawned, instead of silently doing nothing.
let warnedMissingCli = false;

const SEVERITY_TO_VSCODE: Record<OAuthLintFinding['severity'], vscode.DiagnosticSeverity> = {
  INFO: vscode.DiagnosticSeverity.Information,
  LOW: vscode.DiagnosticSeverity.Information,
  MEDIUM: vscode.DiagnosticSeverity.Warning,
  HIGH: vscode.DiagnosticSeverity.Error,
  CRITICAL: vscode.DiagnosticSeverity.Error,
};

export function activate(context: vscode.ExtensionContext): void {
  const diagnostics = vscode.languages.createDiagnosticCollection(DIAG_SOURCE);
  const output = vscode.window.createOutputChannel('OAuthLint');
  const statusBar = new StatusBarController(diagnostics);
  context.subscriptions.push(diagnostics, output, statusBar);

  const debounceTimers = new Map<string, NodeJS.Timeout>();

  const scheduleScan = (uri: vscode.Uri) => {
    const cfg = vscode.workspace.getConfiguration('oauthlint');
    if (!cfg.get<boolean>('enabled', true)) return;
    const existing = debounceTimers.get(uri.toString());
    if (existing) clearTimeout(existing);
    debounceTimers.set(
      uri.toString(),
      setTimeout(() => {
        debounceTimers.delete(uri.toString());
        void scanUri(uri, diagnostics, output, statusBar);
      }, SCAN_DEBOUNCE_MS),
    );
  };

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => scheduleScan(doc.uri)),
    vscode.workspace.onDidOpenTextDocument((doc) => scheduleScan(doc.uri)),
    // Re-render the status bar for whatever file is now in front.
    vscode.window.onDidChangeActiveTextEditor(() => statusBar.refresh()),
    // The count is derived from our diagnostics collection — keep it live.
    vscode.languages.onDidChangeDiagnostics((e) => {
      const active = vscode.window.activeTextEditor?.document.uri;
      if (active && e.uris.some((u) => u.toString() === active.toString())) {
        statusBar.refresh();
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('oauthlint')) {
        for (const editor of vscode.window.visibleTextEditors) {
          scheduleScan(editor.document.uri);
        }
        statusBar.refresh();
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('oauthlint.scanFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      await scanUri(editor.document.uri, diagnostics, output, statusBar);
    }),
    vscode.commands.registerCommand('oauthlint.scanWorkspace', async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) return;
      await scanUri(folder.uri, diagnostics, output, statusBar);
    }),
    vscode.commands.registerCommand('oauthlint.openDoc', (url: string) => {
      if (typeof url === 'string') vscode.env.openExternal(vscode.Uri.parse(url));
    }),
  );

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { language: 'javascript', scheme: 'file' },
        { language: 'javascriptreact', scheme: 'file' },
        { language: 'typescript', scheme: 'file' },
        { language: 'typescriptreact', scheme: 'file' },
      ],
      new OAuthLintCodeActionProvider(),
      { providedCodeActionKinds: [vscode.CodeActionKind.QuickFix] },
    ),
  );

  // Reflect the file that is already in front on activation.
  statusBar.refresh();

  // Kick off an initial scan for already-open editors.
  for (const editor of vscode.window.visibleTextEditors) {
    scheduleScan(editor.document.uri);
  }
}

export function deactivate(): void {
  /* no-op — VS Code disposes our subscriptions automatically */
}

/**
 * Owns the single status bar item and maps the live scan state onto it via
 * the pure `computeStatusBar`. `refresh()` re-reads the active document's
 * diagnostics; `markScanning` / `markError` flip the lifecycle phase.
 */
class StatusBarController implements vscode.Disposable {
  private readonly item: vscode.StatusBarItem;
  private scanning = false;
  private errorDetail: string | undefined;

  constructor(private readonly diagnostics: vscode.DiagnosticCollection) {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'oauthlint.scanFile';
    this.item.name = 'OAuthLint';
  }

  /** Active scan started — show the spinner and clear any prior error. */
  markScanning(): void {
    this.scanning = true;
    this.errorDetail = undefined;
    this.render();
  }

  /** Scan finished without producing a report (e.g. CLI missing). */
  markError(detail: string): void {
    this.scanning = false;
    this.errorDetail = detail;
    this.render();
  }

  /** Scan finished successfully — fall back to the diagnostics-derived count. */
  markScanComplete(): void {
    this.scanning = false;
    this.errorDetail = undefined;
    this.render();
  }

  /** Re-render from the current active editor + scan state. */
  refresh(): void {
    this.render();
  }

  private render(): void {
    const editor = vscode.window.activeTextEditor;
    // Hide for non-supported languages (and when no editor is focused).
    if (!editor || !SUPPORTED_LANGUAGES.has(editor.document.languageId)) {
      this.item.hide();
      return;
    }

    const state: StatusBarState = this.scanning
      ? { phase: 'scanning', count: 0 }
      : this.errorDetail !== undefined
        ? { phase: 'error', count: 0, errorDetail: this.errorDetail }
        : { phase: 'idle', count: this.activeCount(editor.document.uri) };

    const view = computeStatusBar(state);
    this.item.text = view.text;
    this.item.tooltip = view.tooltip;
    this.item.backgroundColor = view.warning
      ? new vscode.ThemeColor('statusBarItem.warningBackground')
      : undefined;
    this.item.show();
  }

  private activeCount(uri: vscode.Uri): number {
    return this.diagnostics.get(uri)?.length ?? 0;
  }

  dispose(): void {
    this.item.dispose();
  }
}

async function scanUri(
  uri: vscode.Uri,
  diagnostics: vscode.DiagnosticCollection,
  output: vscode.OutputChannel,
  statusBar: StatusBarController,
): Promise<void> {
  if (uri.scheme !== 'file') return;
  const cfg = vscode.workspace.getConfiguration('oauthlint');
  const cliPath = cfg.get<string>('cliPath', '') || undefined;
  const rulesDir = cfg.get<string>('rulesDir', '') || undefined;
  const minSeverity = cfg.get<OAuthLintFinding['severity']>('minSeverity', 'MEDIUM');

  const target = uri.fsPath;
  const cwd = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath ?? dirname(resolve(target));

  output.appendLine(`[oauthlint] scanning ${target}`);
  statusBar.markScanning();
  const result = await runOAuthLint({
    target,
    cliPath,
    rulesDir,
    cwd,
    timeoutMs: 30_000,
  });

  if (result.stderr.trim()) {
    output.appendLine(`[oauthlint] stderr: ${result.stderr.trim()}`);
  }
  if (result.timedOut) {
    output.appendLine('[oauthlint] scan timed out after 30s');
    statusBar.markError('scan timed out after 30s');
    return;
  }
  if (!result.report) {
    // exitCode === null with no timeout means the CLI process could not be spawned.
    if (result.exitCode === null) {
      statusBar.markError('CLI not found');
      if (!warnedMissingCli) {
        warnedMissingCli = true;
        void vscode.window
          .showWarningMessage(
            'oauthlint CLI not found. Install it (npm i -g oauthlint) or set "oauthlint.cliPath".',
            'Setup guide',
          )
          .then((choice) => {
            if (choice) {
              vscode.env.openExternal(vscode.Uri.parse('https://oauthlint.dev/getting-started'));
            }
          });
      }
    } else {
      statusBar.markError(`CLI exited with code ${result.exitCode}`);
    }
    output.appendLine(`[oauthlint] no report — CLI exited with code ${result.exitCode}`);
    return;
  }

  const findings = filterBySeverity(result.report.findings, minSeverity);
  const byFile = new Map<string, vscode.Diagnostic[]>();
  for (const f of findings) {
    const path = f.filePath;
    const range = new vscode.Range(
      Math.max(0, f.startLine - 1),
      0,
      Math.max(0, f.endLine - 1),
      Number.MAX_SAFE_INTEGER,
    );
    const diag = new vscode.Diagnostic(
      range,
      f.message.split('\n')[0] ?? f.ruleId,
      SEVERITY_TO_VSCODE[f.severity],
    );
    diag.source = DIAG_SOURCE;
    diag.code = {
      value: f.ruleId,
      target: vscode.Uri.parse(
        f.docUrl ?? `https://oauthlint.dev/rules/${f.ruleId.replace(/^auth\./, '')}`,
      ),
    };
    let bucket = byFile.get(path);
    if (!bucket) {
      bucket = [];
      byFile.set(path, bucket);
    }
    bucket.push(diag);
  }

  // Clear stale diagnostics for the scanned URI tree, then re-apply.
  diagnostics.clear();
  for (const [filePath, diags] of byFile) {
    diagnostics.set(vscode.Uri.file(filePath), diags);
  }

  // Surface the fresh count for the active file (onDidChangeDiagnostics also
  // fires, but mark explicitly so the spinner clears even with no count change).
  statusBar.markScanComplete();

  output.appendLine(
    `[oauthlint] ${findings.length} finding${findings.length === 1 ? '' : 's'} ` +
      `(${result.report.scannedFiles} files, ${result.report.durationMs}ms)`,
  );
}

class OAuthLintCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    for (const diag of context.diagnostics) {
      if (diag.source !== DIAG_SOURCE) continue;
      const ruleId =
        typeof diag.code === 'object' && diag.code && 'value' in diag.code
          ? String(diag.code.value)
          : typeof diag.code === 'string'
            ? diag.code
            : null;
      if (!ruleId) continue;

      const lineText = document.lineAt(diag.range.start.line).text;
      const indent = leadingIndent(lineText);
      const directive = buildDisableNextLineDirective({ ruleId, indent });

      const action = new vscode.CodeAction(
        `Suppress ${ruleId} on this line`,
        vscode.CodeActionKind.QuickFix,
      );
      action.diagnostics = [diag];
      action.edit = new vscode.WorkspaceEdit();
      action.edit.insert(
        document.uri,
        new vscode.Position(diag.range.start.line, 0),
        `${directive}\n`,
      );
      actions.push(action);

      // Open-doc action — short-circuit to the doc URL stored on the diag code.
      const docTarget =
        typeof diag.code === 'object' && diag.code && 'target' in diag.code
          ? diag.code.target.toString()
          : null;
      if (docTarget) {
        const docAction = new vscode.CodeAction(
          `Open documentation for ${ruleId}`,
          vscode.CodeActionKind.QuickFix,
        );
        docAction.command = {
          title: 'Open documentation',
          command: 'oauthlint.openDoc',
          arguments: [docTarget],
        };
        actions.push(docAction);
      }
    }
    return actions;
  }
}
