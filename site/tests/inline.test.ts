import { describe, expect, it } from 'vitest';
import { messageBlocks, renderInline, stripInline, titleAndBody } from '../src/lib/inline';

describe('renderInline', () => {
  it('renders backtick spans as <code> and escapes their contents', () => {
    expect(renderInline('use `a < b` here')).toBe('use <code>a &lt; b</code> here');
  });

  it('renders *italic* as <em> but not inside code', () => {
    expect(renderInline('a *strong* point')).toBe('a <em>strong</em> point');
    expect(renderInline('`a * b`')).toBe('<code>a * b</code>');
  });

  it('escapes HTML in plain text so nothing unescaped is emitted', () => {
    expect(renderInline('<script>&"x"')).toBe('&lt;script&gt;&amp;&quot;x&quot;');
  });

  it('leaves no literal backticks in the output', () => {
    expect(renderInline('set `Access-Control-Allow-Origin: *`')).not.toContain('`');
  });
});

describe('stripInline', () => {
  it('drops backticks and italic markers for plain-text contexts', () => {
    expect(stripInline('the `SECRET_KEY` is *required*')).toBe('the SECRET_KEY is required');
  });
});

describe('messageBlocks', () => {
  it('joins hard-wrapped lines within a paragraph', () => {
    expect(messageBlocks('one two\nthree four')).toEqual([
      { type: 'p', text: 'one two three four' },
    ]);
  });

  it('splits paragraphs on blank lines', () => {
    expect(messageBlocks('para one\n\npara two')).toEqual([
      { type: 'p', text: 'para one' },
      { type: 'p', text: 'para two' },
    ]);
  });

  it('turns a dash-bullet list into a ul, joining wrapped item lines', () => {
    const msg = 'Pick one:\n - first item\n   continues\n - second item';
    expect(messageBlocks(msg)).toEqual([
      { type: 'p', text: 'Pick one:' },
      { type: 'ul', items: ['first item continues', 'second item'] },
    ]);
  });
});

describe('titleAndBody', () => {
  it('uses the first sentence as the title and the rest as the body', () => {
    const { title, body } = titleAndBody('First sentence here. Second one follows.');
    expect(title).toBe('First sentence here.');
    expect(body).toEqual([{ type: 'p', text: 'Second one follows.' }]);
  });

  it('does not split on a period inside an inline-code span', () => {
    const { title } = titleAndBody('Set `os.environ` correctly here. Then relax.');
    expect(title).toBe('Set `os.environ` correctly here.');
  });

  it('does not split on an abbreviation like i.e.', () => {
    const { title } = titleAndBody('A value over the limit, i.e. too long, is unsafe. Fix it.');
    expect(title).toBe('A value over the limit, i.e. too long, is unsafe.');
  });

  it('keeps following list blocks in the body', () => {
    const { title, body } = titleAndBody('Lead in. Decide:\n - a\n - b');
    expect(title).toBe('Lead in.');
    expect(body).toEqual([
      { type: 'p', text: 'Decide:' },
      { type: 'ul', items: ['a', 'b'] },
    ]);
  });
});
