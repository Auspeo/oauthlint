import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

/**
 * Sanity checks for action.yml + entrypoint.sh.
 *
 * We can't realistically run the Docker image in unit tests, but we can
 * make sure the inputs / outputs / argument-order contract stays in sync
 * between action.yml and the shell entrypoint.
 */

interface ActionYml {
  name: string;
  description: string;
  branding?: { icon?: string; color?: string };
  inputs?: Record<string, { description: string; required: boolean; default?: string }>;
  outputs?: Record<string, { description: string; value: string }>;
  runs: { using: string; image: string; args: string[] };
}

const here = new URL('.', import.meta.url).pathname;
const actionPath = `${here}../action.yml`;
const entrypointPath = `${here}../entrypoint.sh`;

describe('action.yml', () => {
  it('parses and exposes the documented inputs', async () => {
    const yml = parseYaml(await readFile(actionPath, 'utf8')) as ActionYml;
    expect(yml.name).toMatch(/OAuthLint/);
    expect(yml.inputs).toBeDefined();
    const inputNames = Object.keys(yml.inputs ?? {});
    for (const expected of ['path', 'severity', 'fail-on', 'json', 'output']) {
      expect(inputNames, `missing input: ${expected}`).toContain(expected);
    }
  });

  it('declares both findings and highest-severity as outputs', async () => {
    const yml = parseYaml(await readFile(actionPath, 'utf8')) as ActionYml;
    expect(Object.keys(yml.outputs ?? {})).toEqual(
      expect.arrayContaining(['findings', 'highest-severity']),
    );
  });

  it('forwards inputs as args in the documented order', async () => {
    const yml = parseYaml(await readFile(actionPath, 'utf8')) as ActionYml;
    expect(yml.runs.args).toEqual([
      '${{ inputs.path }}',
      '${{ inputs.severity }}',
      '${{ inputs.fail-on }}',
      '${{ inputs.json }}',
      '${{ inputs.output }}',
    ]);
  });
});

describe('entrypoint.sh', () => {
  it('reads positional args matching action.yml order', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/PATH_TO_SCAN="\$\{1:-/);
    expect(sh).toMatch(/SEVERITY="\$\{2:-/);
    expect(sh).toMatch(/FAIL_ON="\$\{3:-/);
    expect(sh).toMatch(/EMIT_JSON="\$\{4:-/);
    expect(sh).toMatch(/OUTPUT_PATH="\$\{5:-/);
  });

  it('writes GITHUB_OUTPUT for both declared outputs', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/findings=\$FINDINGS"?\s*>>\s*"?\$GITHUB_OUTPUT/);
    expect(sh).toMatch(/highest-severity=\$HIGHEST"?\s*>>\s*"?\$GITHUB_OUTPUT/);
  });

  it('invokes oauthlint via npx (not a locally bundled copy)', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/npx --yes oauthlint/);
  });

  it('uses set -euo pipefail (fail fast on errors)', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/set -euo pipefail/);
  });
});
