/**
 * Site-wide release announcement banner — single source of truth.
 *
 * Set `announcement` to advertise the latest release; set it to `null` to
 * remove the banner entirely (nothing renders, no layout shift). One edit per
 * release: bump `version` (which re-surfaces the bar for everyone who dismissed
 * the previous one — see `shouldShowAnnouncement`), update `text`, and point
 * `href` at the release notes.
 */
export interface Announcement {
  /** Release identifier. Drives per-version dismissal: a new value re-shows the bar. */
  version: string;
  /** Short headline shown in the bar. Keep it count-resilient ("100+", not "103"). */
  text: string;
  /** Where the bar links. External URLs open in a new tab (rel=noopener). */
  href: string;
}

export const announcement: Announcement | null = {
  version: 'v0.7.0',
  text: 'v0.7.0 is out: 130+ rules across JavaScript, TypeScript, Python, Go, Java, and Rust, plus autofix with a dry-run preview and dataflow analysis.',
  href: 'https://github.com/Auspeo/oauthlint/releases/tag/oauthlint%400.7.0',
};

/**
 * Pure decision: should the banner show, given the current announcement version
 * and the version the visitor previously dismissed (from localStorage)?
 *
 * - No announcement configured → never show.
 * - Nothing dismissed → show.
 * - Dismissed version differs from the current version → a NEW release, show again.
 * - Dismissed version equals the current version → stay hidden.
 *
 * Kept dependency-free and DOM-free so it unit-tests in plain Node and can run
 * inline in the browser with the same semantics.
 */
export function shouldShowAnnouncement(
  currentVersion: string | null | undefined,
  dismissedVersion: string | null | undefined,
): boolean {
  if (!currentVersion) return false;
  return dismissedVersion !== currentVersion;
}

/** localStorage key holding the dismissed announcement version. */
export const ANNOUNCEMENT_STORAGE_KEY = 'ol-announce';
