import { dirname, resolve } from 'node:path';
import * as vscode from 'vscode';
import { type ScanScope, applyScanDiagnostics } from './diagnostics.js';
import { EngineManager, EngineUnavailableError } from './engine.js';
import { buildApplyFixEdit } from './fix.js';
import { type FindingHoverData, buildFindingHoverMarkdown } from './hover.js';
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

// Prompt once per session when the scan engine can't be obtained, instead of
// silently doing nothing. Reset when the user asks to retry.
let warnedEngineUnavailable = false;

/** Where the "Docs" action on the engine-unavailable prompt points. */
const VSCODE_DOCS_URL = 'https://oauthlint.dev/docs/vscode';

/**
 * Surface a one-time, actionable notice when the managed scan engine cannot be
 * obtained (for example an offline first run, before the one-time engine
 * download has succeeded). Offers Retry, which re-attempts the download and
 * re-scans, and Docs. The engine and rule pack are otherwise fully managed —
 * there is nothing for the user to install.
 */
function promptEngineUnavailable(detail: string): void {
  if (warnedEngineUnavailable) return;
  warnedEngineUnavailable = true;
  void vscode.window
    .showErrorMessage(`OAuthLint could not start its scan engine. ${detail}`, 'Retry', 'Docs')
    .then((choice) => {
      if (choice === 'Retry') {
        void vscode.commands.executeCommand('oauthlint.retryEngineSetup');
      } else if (choice === 'Docs') {
        vscode.env.openExternal(vscode.Uri.parse(VSCODE_DOCS_URL));
      }
    });
}

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

  // Owns the managed scan engine (Opengrep): resolves a cached binary, an
  // opengrep on PATH, or downloads the pinned build on first use. A single
  // instance memoises the resolved path across scans.
  const engine = new EngineManager({
    globalStorageDir: context.globalStorageUri.fsPath,
    getEnginePath: () =>
      vscode.workspace.getConfiguration('oauthlint').get<string>('enginePath', '') || undefined,
    withDownloadUI: (run) =>
      vscode.window.withProgress(
        { location: vscode.ProgressLocation.Notification, title: 'OAuthLint', cancellable: false },
        (progress) => run((message) => progress.report({ message })),
      ),
  });

  // Associate each diagnostic we publish with the full finding behind it, so the
  // hover can surface richer context (full message, CWE, oauthlintRuleId) than
  // the squiggle's first-line summary. Keyed by the live Diagnostic object the
  // collection hands back, so entries fall away with their diagnostics.
  const findingByDiagnostic = new WeakMap<vscode.Diagnostic, OAuthLintFinding>();

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
        void scanUri(uri, engine, diagnostics, output, statusBar, findingByDiagnostic);
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
      await scanUri(
        editor.document.uri,
        engine,
        diagnostics,
        output,
        statusBar,
        findingByDiagnostic,
      );
    }),
    vscode.commands.registerCommand('oauthlint.scanWorkspace', async () => {
      const folder = vscode.workspace.workspaceFolders?.[0];
      if (!folder) return;
      await scanUri(
        folder.uri,
        engine,
        diagnostics,
        output,
        statusBar,
        findingByDiagnostic,
        'workspace',
      );
    }),
    vscode.commands.registerCommand('oauthlint.openDoc', (url: string) => {
      if (typeof url === 'string') vscode.env.openExternal(vscode.Uri.parse(url));
    }),
    // Retry engine setup: clear the memoised failure, reset the one-time notice,
    // and re-scan the active file so the download is re-attempted immediately.
    vscode.commands.registerCommand('oauthlint.retryEngineSetup', async () => {
      engine.reset();
      warnedEngineUnavailable = false;
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        await scanUri(
          editor.document.uri,
          engine,
          diagnostics,
          output,
          statusBar,
          findingByDiagnostic,
        );
      }
    }),
  );

  const documentSelectors: vscode.DocumentSelector = [
    { language: 'javascript', scheme: 'file' },
    { language: 'javascriptreact', scheme: 'file' },
    { language: 'typescript', scheme: 'file' },
    { language: 'typescriptreact', scheme: 'file' },
  ];

  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      documentSelectors,
      new OAuthLintCodeActionProvider(findingByDiagnostic),
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      },
    ),
    // Rich hover for OAuthLint findings — reuses the diagnostics we already
    // publish (matched by position) and the finding behind each one. Disposed
    // with the rest of our subscriptions on deactivate.
    vscode.languages.registerHoverProvider(
      documentSelectors,
      new OAuthLintHoverProvider(diagnostics, findingByDiagnostic),
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
  engine: EngineManager,
  diagnostics: vscode.DiagnosticCollection,
  output: vscode.OutputChannel,
  statusBar: StatusBarController,
  findingByDiagnostic: WeakMap<vscode.Diagnostic, OAuthLintFinding>,
  scope: ScanScope = 'file',
): Promise<void> {
  if (uri.scheme !== 'file') return;
  const cfg = vscode.workspace.getConfiguration('oauthlint');
  const rulesDir = cfg.get<string>('rulesDir', '') || undefined;
  const minSeverity = cfg.get<OAuthLintFinding['severity']>('minSeverity', 'MEDIUM');

  const target = uri.fsPath;
  const cwd = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath ?? dirname(resolve(target));

  output.appendLine(`[oauthlint] scanning ${target}`);
  statusBar.markScanning();

  // Resolve (and, on first use, download) the managed scan engine. A failure
  // here must never crash the extension — surface an actionable notice instead.
  let enginePath: string;
  try {
    enginePath = await engine.resolve();
  } catch (err) {
    const detail = err instanceof EngineUnavailableError ? err.message : String(err);
    output.appendLine(`[oauthlint] scan engine unavailable: ${detail}`);
    statusBar.markError('scan engine unavailable');
    promptEngineUnavailable(detail);
    return;
  }

  const result = await runOAuthLint({
    target,
    rulesDir,
    // Drive the managed Opengrep binary, which has no `--metrics` option.
    semgrepPath: enginePath,
    metrics: false,
    cwd,
    timeoutMs: 30_000,
  });

  if (result.stderr.trim()) {
    output.appendLine(`[oauthlint] stderr: ${result.stderr.trim()}`);
  }
  if (result.semgrepMissing) {
    // The managed engine resolved but then could not be spawned (e.g. the
    // binary was removed mid-session). Reset so the next attempt re-downloads.
    output.appendLine('[oauthlint] scan engine could not be run — cannot scan');
    statusBar.markError('scan engine unavailable');
    engine.reset();
    promptEngineUnavailable('The scan engine could not be run. Retry to re-download it.');
    return;
  }
  if (result.timedOut) {
    output.appendLine('[oauthlint] scan timed out after 30s');
    statusBar.markError('scan timed out after 30s');
    return;
  }
  if (result.outputCapped) {
    output.appendLine('[oauthlint] scan aborted — output exceeded the size cap');
    statusBar.markError('scan output too large');
    return;
  }
  if (!result.report) {
    statusBar.markError('scan failed');
    output.appendLine(`[oauthlint] no report — scan failed (${result.stderr.trim()})`);
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
    findingByDiagnostic.set(diag, f);
    let bucket = byFile.get(path);
    if (!bucket) {
      bucket = [];
      byFile.set(path, bucket);
    }
    bucket.push(diag);
  }

  // Remove the previous scan's stale diagnostics, then re-apply. A single-file
  // scan only drops its own file's entries (delete) so a concurrent scan of
  // another file inside the debounce window isn't clobbered; a workspace scan
  // is a full refresh and clears everything.
  applyScanDiagnostics(diagnostics, {
    scope,
    scannedUri: uri,
    byFile,
    toUri: (filePath) => vscode.Uri.file(filePath),
  });

  // Surface the fresh count for the active file (onDidChangeDiagnostics also
  // fires, but mark explicitly so the spinner clears even with no count change).
  statusBar.markScanComplete();

  output.appendLine(
    `[oauthlint] ${findings.length} finding${findings.length === 1 ? '' : 's'} ` +
      `(${result.report.scannedFiles} files, ${result.report.durationMs}ms)`,
  );
}

class OAuthLintCodeActionProvider implements vscode.CodeActionProvider {
  constructor(private readonly findingByDiagnostic: WeakMap<vscode.Diagnostic, OAuthLintFinding>) {}

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

      // "Apply fix" — offered first and marked preferred when the finding
      // behind this diagnostic carries an autofix. We apply the edit ourselves
      // (a WorkspaceEdit over the fix's exact span) rather than shelling out to
      // `oauthlint --fix`, so it's instant and scoped to this one finding.
      const finding = this.findingByDiagnostic.get(diag);
      const fixEdit = finding ? buildApplyFixEdit(finding) : undefined;
      if (fixEdit) {
        const applyAction = new vscode.CodeAction(fixEdit.title, vscode.CodeActionKind.QuickFix);
        applyAction.diagnostics = [diag];
        applyAction.isPreferred = true;
        applyAction.edit = new vscode.WorkspaceEdit();
        applyAction.edit.replace(
          document.uri,
          new vscode.Range(
            fixEdit.startLine,
            fixEdit.startCharacter,
            fixEdit.endLine,
            fixEdit.endCharacter,
          ),
          fixEdit.replacement,
        );
        actions.push(applyAction);
      }

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

/**
 * Surfaces a Markdown hover when the cursor is over a range covered by one of
 * our diagnostics. The matching is driven entirely by the diagnostics
 * collection we own; the finding stored against each diagnostic supplies the
 * richer fields (full message, CWE, oauthlintRuleId) that the squiggle omits.
 */
class OAuthLintHoverProvider implements vscode.HoverProvider {
  constructor(
    private readonly diagnostics: vscode.DiagnosticCollection,
    private readonly findingByDiagnostic: WeakMap<vscode.Diagnostic, OAuthLintFinding>,
  ) {}

  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const diags = this.diagnostics.get(document.uri);
    const hit = diags?.find((d) => d.source === DIAG_SOURCE && d.range.contains(position));
    if (!hit) return undefined;

    const data = hoverDataFor(hit, this.findingByDiagnostic.get(hit));
    if (!data) return undefined;

    const markdown = new vscode.MarkdownString(buildFindingHoverMarkdown(data));
    // Plain Markdown only (links + emphasis) — no command URIs to trust.
    markdown.isTrusted = false;
    return new vscode.Hover(markdown, hit.range);
  }
}

/**
 * Project a diagnostic (plus the finding behind it, when present) onto the
 * data the hover renders. Prefers the finding for the full message + metadata,
 * falling back to the diagnostic's own code/message when no finding is mapped.
 */
function hoverDataFor(
  diag: vscode.Diagnostic,
  finding: OAuthLintFinding | undefined,
): FindingHoverData | undefined {
  if (finding) {
    return {
      ruleId: finding.ruleId,
      oauthlintRuleId: finding.oauthlintRuleId,
      severity: finding.severity,
      message: finding.message,
      docUrl: finding.docUrl ?? docUrlFromCode(diag.code),
      cwe: finding.cwe,
      // `owasp` is not emitted by the CLI today — omitted rather than fabricated.
    };
  }

  const ruleId = ruleIdFromCode(diag.code);
  if (!ruleId) return undefined;
  return {
    ruleId,
    severity: SEVERITY_LABELS[diag.severity],
    message: typeof diag.message === 'string' ? diag.message : '',
    docUrl: docUrlFromCode(diag.code),
  };
}

/** Reverse of `SEVERITY_TO_VSCODE`, for the (rare) finding-less fallback. */
const SEVERITY_LABELS: Record<vscode.DiagnosticSeverity, string> = {
  [vscode.DiagnosticSeverity.Error]: 'HIGH',
  [vscode.DiagnosticSeverity.Warning]: 'MEDIUM',
  [vscode.DiagnosticSeverity.Information]: 'LOW',
  [vscode.DiagnosticSeverity.Hint]: 'INFO',
};

function ruleIdFromCode(code: vscode.Diagnostic['code']): string | null {
  if (typeof code === 'object' && code && 'value' in code) return String(code.value);
  if (typeof code === 'string') return code;
  return null;
}

function docUrlFromCode(code: vscode.Diagnostic['code']): string | undefined {
  if (typeof code === 'object' && code && 'target' in code) return code.target.toString();
  return undefined;
}
