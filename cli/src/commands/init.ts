import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import pc from 'picocolors';

const TEMPLATE = `# OAuthLint config
# Documentation: https://oauthlint.dev/docs/config
version: 1

# Files to scan
include:
  - "src/**/*.{ts,tsx,js,jsx,mjs,cjs}"
exclude:
  - "**/*.test.{ts,tsx,js,jsx}"
  - "**/*.spec.{ts,tsx,js,jsx}"
  - "node_modules/**"
  - "dist/**"
  - "build/**"

# Per-rule overrides:
#   off    → disable the rule
#   warn   → emit but don't affect exit code
#   <SEV>  → override severity (INFO | LOW | MEDIUM | HIGH | CRITICAL)
# rules:
#   auth.cookie.no-samesite: warn
#   auth.session.id-in-url: off

# Custom rules directory (in addition to the bundled rules)
# customRulesDir: ./security/oauthlint-rules

# Exit code policy: fail when any finding ≥ this severity is present.
# Use "off" to never fail the run.
failOn: HIGH
`;

export interface InitOptions {
  cwd: string;
  force?: boolean;
  stream?: NodeJS.WritableStream;
}

export async function runInit(opts: InitOptions): Promise<number> {
  const out = opts.stream ?? process.stdout;
  const target = resolve(opts.cwd, '.oauthlintrc.yml');
  if (existsSync(target) && !opts.force) {
    out.write(pc.yellow(`✗ ${target} already exists — pass --force to overwrite.\n`));
    return 1;
  }
  await writeFile(target, TEMPLATE, 'utf8');
  out.write(pc.green(`✓ Wrote ${target}\n`));
  out.write(pc.dim(`Next: run ${pc.bold('npx oauthlint scan .')} to try it.\n`));
  return 0;
}

// Exported for tests so we can assert on the template content directly.
export const __TEMPLATE = TEMPLATE;
// Keep `join` available for downstream tests that want to construct paths
// without re-importing node:path.
export const __join = join;
