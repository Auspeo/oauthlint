/**
 * Build-time syntax highlighting for rule code examples.
 *
 * Uses Shiki's dual-theme mode so a single render emits inline `--shiki` and
 * `--shiki-dark` CSS variables. The site flips themes via `data-theme` on
 * `<html>`; the small CSS rule shipped alongside the rendered HTML (see
 * `[slug].astro`) picks the right variable per theme. No runtime highlighter
 * is shipped — everything is rendered during the Astro build.
 */
import { type BundledLanguage, codeToHtml } from 'shiki';
import type { FixtureLang } from './rules';

// Themes chosen to sit cleanly on the graphite "Tracer" `--ol-code-bg`
// surface. We override Shiki's own background to transparent (below) so the
// existing code-panel chrome / surface shows through in both themes.
const DARK_THEME = 'github-dark-default';
const LIGHT_THEME = 'github-light-default';

/** Fixture language id -> Shiki bundled language id. */
const SHIKI_LANG: Record<FixtureLang, BundledLanguage> = {
  ts: 'typescript',
  js: 'javascript',
  python: 'python',
  go: 'go',
  java: 'java',
  rust: 'rust',
};

/**
 * Highlight a code fixture into a `<pre class="shiki shiki-themes ...">` HTML
 * string carrying dual-theme inline CSS variables. The result is injected with
 * `set:html`; theme selection is handled by the accompanying CSS rule.
 */
export async function highlightCode(code: string, language: FixtureLang): Promise<string> {
  return codeToHtml(code, {
    lang: SHIKI_LANG[language],
    themes: { light: LIGHT_THEME, dark: DARK_THEME },
    // Let the panel surface (`--ol-code-bg` / `--ol-canvas`) show through
    // rather than Shiki painting its own background.
    defaultColor: false,
  });
}
