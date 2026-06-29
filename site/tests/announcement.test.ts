import { describe, expect, it } from 'vitest';
import {
  ANNOUNCEMENT_STORAGE_KEY,
  announcement,
  shouldShowAnnouncement,
} from '../src/data/announcement';

describe('shouldShowAnnouncement', () => {
  it('shows when nothing was dismissed', () => {
    expect(shouldShowAnnouncement('v0.4.0', null)).toBe(true);
    expect(shouldShowAnnouncement('v0.4.0', undefined)).toBe(true);
    expect(shouldShowAnnouncement('v0.4.0', '')).toBe(true);
  });

  it('hides when the dismissed version matches the current one', () => {
    expect(shouldShowAnnouncement('v0.4.0', 'v0.4.0')).toBe(false);
  });

  it('re-shows when a NEW release supersedes a dismissed older version', () => {
    expect(shouldShowAnnouncement('v0.5.0', 'v0.4.0')).toBe(true);
  });

  it('never shows when there is no current announcement', () => {
    expect(shouldShowAnnouncement(null, null)).toBe(false);
    expect(shouldShowAnnouncement(undefined, 'v0.4.0')).toBe(false);
    expect(shouldShowAnnouncement('', 'v0.4.0')).toBe(false);
  });
});

describe('announcement config', () => {
  it('uses the agreed localStorage key', () => {
    expect(ANNOUNCEMENT_STORAGE_KEY).toBe('ol-announce');
  });

  it('is either null or a fully-formed announcement', () => {
    if (announcement === null) return; // disabled is valid
    expect(typeof announcement.version).toBe('string');
    expect(announcement.version.length).toBeGreaterThan(0);
    expect(typeof announcement.text).toBe('string');
    expect(announcement.text.length).toBeGreaterThan(0);
    expect(announcement.href).toMatch(/^https?:\/\//);
  });

  it('keeps the rule count count-resilient (no frozen exact number)', () => {
    if (announcement === null) return;
    // "100+" is fine; "103 rules" would freeze a count that drifts.
    expect(announcement.text).not.toMatch(/\b\d{2,3} rules\b/);
  });

  it('keeps the language count count-resilient (list languages, never "N languages")', () => {
    if (announcement === null) return;
    // "five languages" / "6 languages" freezes a count that drifts as families
    // are added. List the languages (or drop the count) instead.
    expect(announcement.text).not.toMatch(/\b(five|six|seven|\d+)\s+languages\b/i);
  });

  it('carries no personal names or legacy product names', () => {
    if (announcement === null) return;
    expect(announcement.text).not.toMatch(/OAuthHound/i);
  });
});
