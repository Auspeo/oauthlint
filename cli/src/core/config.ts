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
