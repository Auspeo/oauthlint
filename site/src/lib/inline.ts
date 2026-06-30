/**
 * Safe inline + lightweight block rendering for rule-message prose.
 *
 * Rule messages are authored as literal-block YAML scalars: flowing prose,
 * hard-wrapped at ~70 columns, paragraphs separated by blank lines, occasional
 * dash-bullet lists, `backtick` inline-code spans and `*italic*` emphasis. This
 * module reconstructs that into paragraph/list blocks and renders the inline
 * markup to safe HTML: every character is HTML-escaped first and only `code`
 * spans and `*italic*` become tags, so nothing unescaped is ever emitted.
 */

export type Block = { type: 'p'; text: string } | { type: 'ul'; items: string[] };

const HTML_ESCAPE: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE[c] ?? c);
}

/** Apply `*italic*` emphasis to already-escaped text (asterisks survive escaping). */
function emphasis(escaped: string): string {
  return escaped.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
}

/**
 * Render one line of prose as safe HTML: `backtick` spans become `<code>`,
 * `*italic*` becomes `<em>`, all other text is HTML-escaped. Emphasis is not
 * applied inside code spans. The result is safe for Astro `set:html`.
 */
export function renderInline(text: string): string {
  let out = '';
  let last = 0;
  const re = /`([^`]+)`/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop.
  while ((m = re.exec(text)) !== null) {
    out += emphasis(escapeHtml(text.slice(last, m.index)));
    out += `<code>${escapeHtml(m[1])}</code>`;
    last = m.index + m[0].length;
  }
  out += emphasis(escapeHtml(text.slice(last)));
  return out;
}

/** Strip inline markup to plain text (meta tags, `<title>`, search index). */
export function stripInline(text: string): string {
  return text.replace(/`/g, '').replace(/\*([^*\n]+)\*/g, '$1');
}

const LIST_LINE = /^\s*-\s+/;
const WS = /\s+/g;

/**
 * Parse a literal-block message into paragraph and list blocks. Within a
 * paragraph, hard-wrapped lines are joined; a run of `- ` lines becomes a list,
 * with each item's wrapped continuation lines joined into the item.
 */
export function messageBlocks(message: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of message.split(/\n[ \t]*\n/)) {
    let para: string[] = [];
    let items: string[] | null = null;

    const flushPara = () => {
      const text = para.join(' ').replace(WS, ' ').trim();
      if (text) blocks.push({ type: 'p', text });
      para = [];
    };
    const flushList = () => {
      if (items) {
        const cleaned = items.map((it) => it.replace(WS, ' ').trim()).filter(Boolean);
        if (cleaned.length) blocks.push({ type: 'ul', items: cleaned });
      }
      items = null;
    };

    for (const line of chunk.split('\n')) {
      if (LIST_LINE.test(line)) {
        flushPara();
        if (!items) items = [];
        items.push(line.replace(LIST_LINE, ''));
      } else if (items) {
        // Wrapped continuation of the current list item.
        items[items.length - 1] += ` ${line.trim()}`;
      } else {
        para.push(line.trim());
      }
    }
    flushList();
    flushPara();
  }
  return blocks;
}

// Tokens that end in a period but do not end a sentence. Compared including
// their trailing dot(s) against the word preceding a candidate boundary.
const ABBREVIATIONS = new Set([
  'e.g.',
  'i.e.',
  'etc.',
  'vs.',
  'cf.',
  'al.',
  'approx.',
  'no.',
  'fig.',
]);

/**
 * Index just past the first sentence terminator (`.`/`!`/`?` followed by
 * whitespace or end) that lies OUTSIDE a backtick span and is not the dot of a
 * known abbreviation, so neither a period inside `os.environ` nor `i.e.` ends
 * the sentence. Returns -1 when there is no boundary.
 */
function firstSentenceEnd(text: string): number {
  let inCode = false;
  let wordStart = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '`') {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      wordStart = i + 1;
      continue;
    }
    if (ch === '.' || ch === '!' || ch === '?') {
      const next = text[i + 1];
      if (next === undefined || next === ' ' || next === '\t' || next === '\n') {
        const word = text.slice(wordStart, i + 1).toLowerCase();
        if (ch === '.' && ABBREVIATIONS.has(word)) continue;
        return i + 1;
      }
    }
  }
  return -1;
}

/**
 * Split a message into a one-sentence title and the remaining body blocks.
 * Title = the first sentence of the leading paragraph (kept whole, with its
 * inline markup); body = that paragraph's remainder plus the following blocks.
 */
export function titleAndBody(message: string): { title: string; body: Block[] } {
  const blocks = messageBlocks(message);
  if (blocks.length === 0) return { title: '', body: [] };
  const [first, ...rest] = blocks;
  if (first.type !== 'p') return { title: '', body: blocks };
  const end = firstSentenceEnd(first.text);
  if (end === -1) return { title: first.text, body: rest };
  const remainder = first.text.slice(end).trim();
  return {
    title: first.text.slice(0, end).trim(),
    body: remainder ? [{ type: 'p', text: remainder }, ...rest] : rest,
  };
}
