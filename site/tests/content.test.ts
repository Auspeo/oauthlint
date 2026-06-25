import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlDir = join(__dirname, '..', 'src', 'html');

// Marketing pages owned by the content fixes (rules.html / rule.html excluded —
// owned by another agent).
const OWNED_PAGES = ['index.html', 'docs.html', 'pricing.html', 'about.html', 'notfound.html'];

function read(page: string): string {
  return readFileSync(join(htmlDir, page), 'utf8');
}

describe('marketing page content is evergreen', () => {
  for (const page of OWNED_PAGES) {
    describe(page, () => {
      const html = read(page);

      it('does not freeze a rule count of 90', () => {
        // Strip inline-style design tokens like --ol-space-90 so we only test copy.
        const copy = html.replace(/--ol-[a-z0-9-]+/gi, '');
        expect(copy).not.toMatch(/\b90\b/);
      });

      it('does not hardcode a language count', () => {
        expect(html).not.toMatch(/five languages/i);
        expect(html).not.toMatch(/\b5 languages\b/i);
      });

      it('does not attribute to a personal name', () => {
        for (const name of ['Maurice', 'Anney', 'Mauriceanney', 'webofboss']) {
          expect(html.toLowerCase()).not.toContain(name.toLowerCase());
        }
      });

      it('does not hardcode a GitHub star count', () => {
        expect(html).not.toContain('8.2k');
      });
    });
  }
});
