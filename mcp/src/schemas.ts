import { SEVERITIES } from 'oauthlint';
import { z } from 'zod';
import { SUPPORTED_LANGUAGES } from './languages.js';
import { MAX_CODE_CHARS } from './scanner.js';

/**
 * Tool input schemas as Zod raw shapes (the form `McpServer.registerTool`
 * expects). The SDK validates every call against these before a handler runs,
 * so unknown languages, missing fields and oversized snippets are rejected at
 * the protocol boundary. Exported so the tests can assert the same validation.
 */

const minSeverity = z
  .enum(SEVERITIES)
  .optional()
  .describe(
    'Only report findings at or above this severity. One of INFO, LOW, MEDIUM, HIGH, CRITICAL.',
  );

export const scanCodeShape = {
  code: z
    .string()
    .min(1)
    .max(MAX_CODE_CHARS)
    .describe('The source code snippet to scan. Paste exactly what was generated.'),
  language: z
    .enum(SUPPORTED_LANGUAGES)
    .describe('Language of the snippet. One of javascript, typescript, python, go, java, rust.'),
  minSeverity,
} as const;

export const scanPathShape = {
  path: z
    .string()
    .min(1)
    .describe(
      'A file or directory on disk to scan. Resolved relative to the server working directory.',
    ),
  minSeverity,
} as const;

export const explainRuleShape = {
  rule: z
    .string()
    .min(1)
    .describe(
      'A rule id (auth.jwt.alg-none), slug (jwt-alg-none) or oauthlint-rule-id (AUTH-JWT-001).',
    ),
} as const;

export const listRulesShape = {
  language: z
    .enum(SUPPORTED_LANGUAGES)
    .optional()
    .describe('Only list rules that apply to this language.'),
  minSeverity,
} as const;

// z.object wrappers used by tests to exercise the exact validation the SDK runs.
export const scanCodeInput = z.object(scanCodeShape);
export const scanPathInput = z.object(scanPathShape);
export const explainRuleInput = z.object(explainRuleShape);
export const listRulesInput = z.object(listRulesShape);
