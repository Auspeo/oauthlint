import { describe, expect, it } from 'vitest';
import { MAX_CODE_CHARS } from './scanner.js';
import { listRulesInput, scanCodeInput, scanPathInput } from './schemas.js';

describe('input validation', () => {
  it('accepts a valid scan_code call', () => {
    const parsed = scanCodeInput.safeParse({ code: 'const a = 1;', language: 'typescript' });
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown language', () => {
    const parsed = scanCodeInput.safeParse({ code: 'x', language: 'cobol' });
    expect(parsed.success).toBe(false);
  });

  it('rejects an empty snippet', () => {
    const parsed = scanCodeInput.safeParse({ code: '', language: 'go' });
    expect(parsed.success).toBe(false);
  });

  it('rejects an oversized snippet at the schema boundary', () => {
    const parsed = scanCodeInput.safeParse({
      code: 'a'.repeat(MAX_CODE_CHARS + 1),
      language: 'go',
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an invalid minSeverity', () => {
    const parsed = scanCodeInput.safeParse({
      code: 'x',
      language: 'python',
      minSeverity: 'SCARY',
    });
    expect(parsed.success).toBe(false);
  });

  it('requires a non-empty path for scan_path', () => {
    expect(scanPathInput.safeParse({ path: '' }).success).toBe(false);
    expect(scanPathInput.safeParse({ path: './src' }).success).toBe(true);
  });

  it('rejects an unknown language filter on list_rules', () => {
    expect(listRulesInput.safeParse({ language: 'cobol' }).success).toBe(false);
    expect(listRulesInput.safeParse({}).success).toBe(true);
  });
});
