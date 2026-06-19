import { z } from 'zod';

/**
 * OAuthLint rule severity levels.
 * Mapped to Semgrep severities and used for exit code decisions.
 */
export const SeveritySchema = z.enum(['INFO', 'WARNING', 'ERROR']);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * OAuthLint-specific metadata attached to each rule.
 * The `llm-prevalence` tag is core to our positioning: it indicates
 * how often this anti-pattern appears in code produced by LLMs (Cursor,
 * Claude Code, Copilot, Gemini Code Assist).
 */
export const OAuthLintMetadataSchema = z.object({
  'oauthlint-rule-id': z.string().regex(/^AUTH-[A-Z]+-\d{3}$/, {
    message: 'oauthlint-rule-id must match AUTH-<CATEGORY>-<NNN>',
  }),
  'oauthlint-doc-url': z.string().url(),
  category: z.literal('security'),
  cwe: z
    .string()
    .regex(/^CWE-\d+$/)
    .optional(),
  owasp: z.string().optional(),
  'llm-prevalence': z.enum(['HIGH', 'MEDIUM', 'LOW']),
  references: z.array(z.string().url()).optional(),
  technology: z.array(z.string()).optional(),
});

export type OAuthLintMetadata = z.infer<typeof OAuthLintMetadataSchema>;

/**
 * Semgrep rule shape (subset we actually use).
 * Semgrep accepts many shapes; we only validate the fields we rely on.
 */
const PatternEntrySchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.record(z.string(), z.unknown()), z.array(PatternEntrySchema)]),
);

export const RuleSchema = z
  .object({
    id: z.string().regex(/^auth\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/, {
      message: 'Rule id must follow auth.<category>.<name> (kebab-case)',
    }),
    languages: z.array(z.string()).min(1),
    severity: SeveritySchema,
    message: z.string().min(20, 'Message must be at least 20 characters'),
    metadata: OAuthLintMetadataSchema,
    pattern: PatternEntrySchema.optional(),
    'pattern-either': z.array(PatternEntrySchema).optional(),
    'pattern-not': PatternEntrySchema.optional(),
    'pattern-inside': PatternEntrySchema.optional(),
    'pattern-regex': z.string().optional(),
    'pattern-either-regex': z.array(z.string()).optional(),
    patterns: z.array(PatternEntrySchema).optional(),
    fix: z.string().optional(),
  })
  .refine(
    (rule) =>
      rule.pattern !== undefined ||
      rule['pattern-either'] !== undefined ||
      rule.patterns !== undefined ||
      rule['pattern-regex'] !== undefined ||
      rule['pattern-either-regex'] !== undefined,
    {
      message: 'Rule must define at least one of: pattern, pattern-either, patterns, pattern-regex',
    },
  );

export type Rule = z.infer<typeof RuleSchema>;

export const RuleFileSchema = z.object({
  rules: z.array(RuleSchema).min(1),
});

export type RuleFile = z.infer<typeof RuleFileSchema>;
