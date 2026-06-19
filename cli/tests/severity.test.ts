import { describe, expect, it } from 'vitest';
import {
  exitCodeFor,
  highestSeverity,
  meetsThreshold,
  severityRank,
} from '../src/core/severity.js';

describe('severityRank', () => {
  it('orders the scale from INFO to CRITICAL', () => {
    expect(severityRank('INFO')).toBe(0);
    expect(severityRank('LOW')).toBe(1);
    expect(severityRank('MEDIUM')).toBe(2);
    expect(severityRank('HIGH')).toBe(3);
    expect(severityRank('CRITICAL')).toBe(4);
  });
});

describe('meetsThreshold', () => {
  it('returns true when the actual severity is equal or worse', () => {
    expect(meetsThreshold('HIGH', 'HIGH')).toBe(true);
    expect(meetsThreshold('CRITICAL', 'HIGH')).toBe(true);
  });
  it('returns false when the actual severity is below the threshold', () => {
    expect(meetsThreshold('MEDIUM', 'HIGH')).toBe(false);
    expect(meetsThreshold('LOW', 'CRITICAL')).toBe(false);
  });
});

describe('exitCodeFor', () => {
  it('returns 0 for an empty scan', () => {
    expect(exitCodeFor(null)).toBe(0);
  });
  it('returns 1 for HIGH', () => {
    expect(exitCodeFor('HIGH')).toBe(1);
  });
  it('returns 2 for CRITICAL', () => {
    expect(exitCodeFor('CRITICAL')).toBe(2);
  });
  it('returns 0 for severities below HIGH', () => {
    expect(exitCodeFor('MEDIUM')).toBe(0);
    expect(exitCodeFor('LOW')).toBe(0);
    expect(exitCodeFor('INFO')).toBe(0);
  });
});

describe('highestSeverity', () => {
  it('returns null on empty input', () => {
    expect(highestSeverity([])).toBeNull();
  });
  it('returns the most severe entry', () => {
    expect(
      highestSeverity([{ severity: 'LOW' }, { severity: 'HIGH' }, { severity: 'MEDIUM' }]),
    ).toBe('HIGH');
  });
});
