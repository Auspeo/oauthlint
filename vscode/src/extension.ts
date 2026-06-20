import { dirname, resolve } from 'node:path';
import * as vscode from 'vscode';
import { type OAuthLintFinding, filterBySeverity, runOAuthLint } from './runner.js';
import { buildDisableNextLineDirective, leadingIndent } from './suppressions.js';

const DIAG_SOURCE = 'oauthlint';
const SCAN_DEBOUNCE_MS = 600;

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
  context.subscriptions.push(diagnostics, output);

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
        void scanUri(uri, diagnostics, output);
      }, SCAN_DEBOUNCE_MS),
    );
  };

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => scheduleScan(doc.uri)),
    vscode.workspace.onDidOpenTextDocument((doc) => scheduleScan(doc.uri)),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('oauthlint')) {
        for (const editor of vscode.window.visibleTextEditors) {
          scheduleScan(editor.document.uri);
        }
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('oauthlint.scanFile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;
      await scanUri(editor.document.uri, diagnostics, output);
    }),
    vscode.commands.registerCommand('oauthlint.scanWorkspace', async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) return;
      await scanUri(folder.uri, diagnostics, output);
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

  // Kick off an initial scan for already-open editors.
  for (const editor of vscode.window.visibleTextEditors) {
    scheduleScan(editor.document.uri);
  }
}

export function deactivate(): void {
  /* no-op — VS Code disposes our subscriptions automatically */
}

async function scanUri(
  uri: vscode.Uri,
  diagnostics: vscode.DiagnosticCollection,
  output: vscode.OutputChannel,
): Promise<void> {
  if (uri.scheme !== 'file') return;
  const cfg = vscode.workspace.getConfiguration('oauthlint');
  const cliPath = cfg.get<string>('cliPath', '') || undefined;
  const rulesDir = cfg.get<string>('rulesDir', '') || undefined;
  const minSeverity = cfg.get<OAuthLintFinding['severity']>('minSeverity', 'MEDIUM');

  const target = uri.fsPath;
  const cwd = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath ?? dirname(resolve(target));

  output.appendLine(`[oauthlint] scanning ${target}`);
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
    return;
  }
  if (!result.report) {
    // exitCode === null with no timeout means the CLI process could not be spawned.
    if (result.exitCode === null && !warnedMissingCli) {
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
