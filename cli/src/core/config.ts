import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';
import { type OAuthLintConfig, SEVERITIES } from '../types.js';

const SeverityValue = z.enum(SEVERITIES);

const ConfigSchema = z.object({
  version: z.number().default(1),
  include: z.array(z.string()).optional(),
  exclude: z.array(z.string()).optional(),
  rules: z.record(z.union([z.literal('off'), z.literal('warn'), SeverityValue])).optional(),
  customRulesDir: z.string().optional(),
  failOn: z.union([SeverityValue, z.literal('off')]).default('HIGH'),
  codeFrame: z.boolean().optional(),
});

/**
 * Globs excluded from a scan when the user's config does not set its own
 * `exclude`. These are non-production trees — test, spec, mock, story, e2e, and
 * build output — where auth anti-patterns are fixtures and stubs (mock tokens,
 * fake secrets, throwaway callbacks), not shippable code. Firing there is the
 * classic false positive a low-FP linter must avoid, and it mirrors the intent
 * of the `exclude` block that `oauthlint init` already writes. A user who wants
 * to scan these trees sets `exclude: []` (or their own list) to override.
 */
export const DEFAULT_EXCLUDES: readonly string[] = [
  '**/*.test.*',
  '**/*.spec.*',
  '**/test/**',
  '**/tests/**',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/mocks/**',
  '**/*.stories.*',
  '**/*.cy.*',
  '**/*.e2e.*',
  '**/e2e/**',
  '**/cypress/**',
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
];

export const DEFAULT_CONFIG: OAuthLintConfig = {
  failOn: 'HIGH',
};

export async function loadConfig(cwd: string): Promise<OAuthLintConfig> {
  const explorer = cosmiconfig('oauthlint', {
    searchPlaces: [
      '.oauthlintrc',
      '.oauthlintrc.json',
      '.oauthlintrc.yml',
      '.oauthlintrc.yaml',
      'oauthlint.config.js',
      'oauthlint.config.mjs',
      'oauthlint.config.cjs',
      'package.json',
    ],
  });
  const result = await explorer.search(cwd);
  if (!result || result.isEmpty) return DEFAULT_CONFIG;
  const parsed = ConfigSchema.safeParse(result.config);
  if (!parsed.success) {
    throw new Error(
      `Invalid oauthlint config in ${result.filepath}:\n${parsed.error.issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    );
  }
  return parsed.data;
}
