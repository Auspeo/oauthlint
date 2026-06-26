import { describe, expect, it } from 'vitest';
import { STATUS_ICONS, computeStatusBar } from '../src/statusbar.js';

describe('computeStatusBar — idle', () => {
  it('shows a shield with the finding count', () => {
    const view = computeStatusBar({ phase: 'idle', count: 3 });
    expect(view.text).toBe(`${STATUS_ICONS.idle} OAuthLint: 3`);
    expect(view.warning).toBe(false);
    expect(view.tooltip).toContain('3 findings');
  });

  it('renders zero findings without dropping the count', () => {
    const view = computeStatusBar({ phase: 'idle', count: 0 });
    expect(view.text).toBe(`${STATUS_ICONS.idle} OAuthLint: 0`);
    expect(view.tooltip).toContain('no findings');
  });

  it('uses the singular noun for exactly one finding', () => {
    const view = computeStatusBar({ phase: 'idle', count: 1 });
    expect(view.tooltip).toContain('1 finding in');
    expect(view.tooltip).not.toContain('1 findings');
  });

  it('clamps negative or fractional counts to a sane integer', () => {
    expect(computeStatusBar({ phase: 'idle', count: -5 }).text).toBe(
      `${STATUS_ICONS.idle} OAuthLint: 0`,
    );
    expect(computeStatusBar({ phase: 'idle', count: 2.9 }).text).toBe(
      `${STATUS_ICONS.idle} OAuthLint: 2`,
    );
  });
});

describe('computeStatusBar — scanning', () => {
  it('shows a spinner and the scanning label', () => {
    const view = computeStatusBar({ phase: 'scanning', count: 99 });
    expect(view.text).toBe(`${STATUS_ICONS.scanning} OAuthLint: scanning…`);
    expect(view.warning).toBe(false);
    // Count is irrelevant while scanning.
    expect(view.text).not.toContain('99');
  });
});

describe('computeStatusBar — error', () => {
  it('shows a warning icon and flags the warning background', () => {
    const view = computeStatusBar({ phase: 'error', count: 0 });
    expect(view.text).toBe(`${STATUS_ICONS.error} OAuthLint`);
    expect(view.warning).toBe(true);
  });

  it('points the tooltip at the cliPath setting', () => {
    const view = computeStatusBar({ phase: 'error', count: 0 });
    expect(view.tooltip).toContain('oauthlint.cliPath');
  });

  it('weaves an error detail into the tooltip when provided', () => {
    const view = computeStatusBar({
      phase: 'error',
      count: 0,
      errorDetail: 'CLI not found',
    });
    expect(view.tooltip).toContain('CLI not found');
    expect(view.tooltip).toContain('oauthlint.cliPath');
  });

  it('falls back to a generic message when the detail is blank', () => {
    const view = computeStatusBar({ phase: 'error', count: 0, errorDetail: '   ' });
    expect(view.tooltip).toContain('could not be run');
    expect(view.tooltip).toContain('oauthlint.cliPath');
  });
});
