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
    for (const expected of [
      'path',
      'severity',
      'fail-on',
      'json',
      'output',
      'sarif',
      'sarif-file',
      'annotations',
    ]) {
      expect(inputNames, `missing input: ${expected}`).toContain(expected);
    }
  });

  it('defaults sarif to disabled and sarif-file to oauthlint.sarif', async () => {
    const yml = parseYaml(await readFile(actionPath, 'utf8')) as ActionYml;
    expect(yml.inputs?.sarif?.default).toBe('false');
    expect(yml.inputs?.['sarif-file']?.default).toBe('oauthlint.sarif');
  });

  it('defaults annotations ON (opt-out, not opt-in)', async () => {
    const yml = parseYaml(await readFile(actionPath, 'utf8')) as ActionYml;
    expect(yml.inputs?.annotations?.default).toBe('true');
  });

  it('declares findings, highest-severity, and sarif-file as outputs', async () => {
    const yml = parseYaml(await readFile(actionPath, 'utf8')) as ActionYml;
    expect(Object.keys(yml.outputs ?? {})).toEqual(
      expect.arrayContaining(['findings', 'highest-severity', 'sarif-file']),
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
      '${{ inputs.sarif }}',
      '${{ inputs.sarif-file }}',
      '${{ inputs.annotations }}',
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
    expect(sh).toMatch(/EMIT_SARIF="\$\{6:-/);
    expect(sh).toMatch(/SARIF_PATH="\$\{7:-/);
    expect(sh).toMatch(/EMIT_ANNOTATIONS="\$\{8:-/);
  });

  it('runs the annotate helper only when annotations are enabled', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/if\s+\[\[\s+"\$EMIT_ANNOTATIONS"\s+==\s+"true"\s+\]\]/);
    expect(sh).toMatch(/node "\$SCRIPT_DIR\/annotate\.mjs"/);
  });

  it('never lets the annotation pass gate the job (fail-on off, swallowed exit)', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    // The dedicated annotation scan uses --fail-on off so it can't fail the job.
    expect(sh).toMatch(/ANN_ARGS=\(\s*scan "\$PATH_TO_SCAN" --json --fail-on off/);
    // The final exit code is still the gating scan's, untouched by annotations.
    expect(sh).toMatch(/exit "\$EXIT_CODE"/);
  });

  it('writes GITHUB_OUTPUT for both declared outputs', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/findings=\$FINDINGS"?\s*>>\s*"?\$GITHUB_OUTPUT/);
    expect(sh).toMatch(/highest-severity=\$HIGHEST"?\s*>>\s*"?\$GITHUB_OUTPUT/);
  });

  it('generates SARIF only when enabled and exposes its path as an output', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/if\s+\[\[\s+"\$EMIT_SARIF"\s+==\s+"true"\s+\]\]/);
    expect(sh).toMatch(/oauthlint "\$\{SARIF_ARGS\[@\]\}"\s*>\s*"\$SARIF_PATH"/);
    expect(sh).toMatch(/sarif-file=\$SARIF_PATH"?\s*>>\s*"?\$GITHUB_OUTPUT/);
  });

  it('emits SARIF with --format sarif and never gates the job on it', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/SARIF_ARGS=\(\s*scan "\$PATH_TO_SCAN" --format sarif --fail-on off/);
  });

  it('invokes the CLI directly, isolated from the scanned repo (not via npx)', async () => {
    // The CLI is installed into the image (see Dockerfile) and run directly, so npx
    // never resolves "oauthlint" against the scanned project (which can have its own
    // package.json named oauthlint or a non-npm .npmrc). Guard against regressing to npx.
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/oauthlint "\$\{ARGS\[@\]\}"/);
    expect(sh).not.toMatch(/npx/);
    const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
    expect(dockerfile).toMatch(/npm install -g oauthlint/);
  });

  it('uses set -euo pipefail (fail fast on errors)', async () => {
    const sh = await readFile(entrypointPath, 'utf8');
    expect(sh).toMatch(/set -euo pipefail/);
  });
});
