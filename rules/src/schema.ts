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
  // AUTH-<CATEGORY>-<NNN> for the JS/TS pack (e.g. AUTH-JWT-001); language
  // packs add a language segment (e.g. AUTH-PY-JWT-001).
  'oauthlint-rule-id': z.string().regex(/^AUTH-[A-Z]+(-[A-Z]+)*-\d{3}$/, {
    message:
      'oauthlint-rule-id must match AUTH-<CATEGORY>-<NNN> (optionally AUTH-<LANG>-<CATEGORY>-<NNN>)',
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

/**
 * Semgrep `paths:` filter. Lets a rule scope itself to (or away from) files by
 * glob. We use `exclude` to keep production-grant rules from firing on test,
 * example, vendored, or generated code — locations that should never carry a
 * real application's OAuth misuse. Passed straight through to Semgrep.
 */
const PathsSchema = z.object({
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
});

export const RuleSchema = z
  .object({
    // auth.<category>.<name> for the JS/TS pack; language packs prepend a
    // language segment — auth.<lang>.<category>.<name> (e.g. auth.py.jwt.no-verify).
    // The optional middle segment keeps every existing JS/TS id (and its
    // published doc URL) untouched while making the scheme language-scalable.
    id: z.string().regex(/^auth\.([a-z][a-z0-9]*\.)?[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/, {
      message:
        'Rule id must follow auth.<category>.<name> or auth.<lang>.<category>.<name> (kebab-case)',
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
    // Scope a rule to/away from files by glob (passed through to Semgrep).
    paths: PathsSchema.optional(),
    // Taint-mode rules (Semgrep dataflow).
    mode: z.enum(['search', 'taint']).optional(),
    'pattern-sources': z.array(PatternEntrySchema).optional(),
    'pattern-sinks': z.array(PatternEntrySchema).optional(),
    'pattern-sanitizers': z.array(PatternEntrySchema).optional(),
    'pattern-propagators': z.array(PatternEntrySchema).optional(),
  })
  .refine(
    (rule) =>
      rule.pattern !== undefined ||
      rule['pattern-either'] !== undefined ||
      rule.patterns !== undefined ||
      rule['pattern-regex'] !== undefined ||
      rule['pattern-either-regex'] !== undefined ||
      // Taint mode defines sources + sinks instead of a top-level pattern.
      (rule.mode === 'taint' &&
        rule['pattern-sources'] !== undefined &&
        rule['pattern-sinks'] !== undefined),
    {
      message:
        'Rule must define at least one of: pattern, pattern-either, patterns, pattern-regex, or be a taint rule with pattern-sources + pattern-sinks',
    },
  );

export type Rule = z.infer<typeof RuleSchema>;

export const RuleFileSchema = z.object({
  rules: z.array(RuleSchema).min(1),
});

export type RuleFile = z.infer<typeof RuleFileSchema>;
