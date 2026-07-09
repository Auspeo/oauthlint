/**
 * Pure presentation logic for the OAuthLint status bar item.
 *
 * Kept free of the `vscode` runtime so the (scanning, count, error) ->
 * (text, tooltip) mapping can be unit-tested without the Extension
 * Development Host. `extension.ts` owns the StatusBarItem instance and
 * simply assigns the values this module computes.
 */

/** The mutually-exclusive lifecycle states the status bar can render. */
export type StatusBarPhase = 'idle' | 'scanning' | 'error';

export interface StatusBarState {
  phase: StatusBarPhase;
  /** OAuthLint finding count for the active document (idle phase only). */
  count: number;
  /** Human-readable error detail, surfaced in the tooltip (error phase only). */
  errorDetail?: string;
}

export interface StatusBarPresentation {
  /** Text shown in the status bar, including a `$(codicon)` prefix. */
  text: string;
  /** Hover tooltip. */
  tooltip: string;
  /**
   * When true, the item should adopt the editor's warning background to
   * draw attention (used for the error phase).
   */
  warning: boolean;
}

/** Codicon ids used in the status bar text, centralised for the tests. */
export const STATUS_ICONS = {
  idle: '$(shield)',
  scanning: '$(sync~spin)',
  error: '$(warning)',
} as const;

/**
 * Compute the text / tooltip / styling for the status bar item from the
 * current scan state. Pure: no side effects, no `vscode` imports.
 */
export function computeStatusBar(state: StatusBarState): StatusBarPresentation {
  switch (state.phase) {
    case 'scanning':
      return {
        text: `${STATUS_ICONS.scanning} OAuthLint: scanning…`,
        tooltip: 'OAuthLint is scanning the active file…',
        warning: false,
      };
    case 'error': {
      const detail = state.errorDetail?.trim();
      const tooltip = detail
        ? `OAuthLint: ${detail}\nSee the OAuthLint output channel for details.`
        : 'OAuthLint: the scan could not run.\nSee the OAuthLint output channel for details.';
      return {
        text: `${STATUS_ICONS.error} OAuthLint`,
        tooltip,
        warning: true,
      };
    }
    default: {
      const count = Math.max(0, Math.trunc(state.count));
      const noun = count === 1 ? 'finding' : 'findings';
      const tooltip =
        count === 0
          ? 'OAuthLint: no findings in the active file.\nClick to re-scan.'
          : `OAuthLint: ${count} ${noun} in the active file.\nClick to re-scan.`;
      return {
        text: `${STATUS_ICONS.idle} OAuthLint: ${count}`,
        tooltip,
        warning: false,
      };
    }
  }
}
