import { describe, expect, it } from 'vitest';
import { extractCode } from '../src/adapters/types.js';

describe('extractCode', () => {
  it('pulls the first fenced code block out of prose', () => {
    const markdown = [
      'Here is the code you asked for:',
      '',
      '```ts',
      'const x = 1;',
      'export { x };',
      '```',
      '',
      'Let me know if you need anything else.',
    ].join('\n');
    const code = extractCode(markdown);
    expect(code).toContain('const x = 1;');
    expect(code).toContain('export { x };');
    expect(code).not.toContain('Here is the code');
    expect(code).not.toContain('```');
    expect(code).not.toContain('Let me know');
  });

  it('returns the whole text when there is no fence', () => {
    const raw = 'const y = 2;\nexport { y };\n';
    expect(extractCode(raw)).toBe('const y = 2;\nexport { y };');
  });

  it('takes only the first block when several are present', () => {
    const markdown = '```js\nconst first = 1;\n```\n\n```js\nconst second = 2;\n```\n';
    const code = extractCode(markdown);
    expect(code).toContain('first');
    expect(code).not.toContain('second');
  });

  it('handles a fence with no info string', () => {
    const markdown = '```\nplain = True\n```';
    expect(extractCode(markdown)).toContain('plain = True');
  });
});
