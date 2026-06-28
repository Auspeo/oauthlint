import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

/**
 * The root `action.yml` is the GitHub Marketplace-facing entrypoint. It is a
 * thin COMPOSITE action that delegates to the real Docker action in `action/`
 * via `uses: ./action`. These tests guard two things:
 *
 *   1. The root action is schema-valid for the Marketplace (name, description,
 *      branding, composite runs block).
 *   2. It MIRRORS `action/action.yml` exactly (same inputs + defaults, same
 *      outputs) and passes every input through to the delegated step — so the
 *      two entrypoints can never silently drift.
 */

interface DockerActionYml {
  name: string;
  description: string;
  branding?: { icon?: string; color?: string };
  inputs?: Record<string, { description: string; required: boolean; default?: string }>;
  outputs?: Record<string, { description: string; value: string }>;
  runs: { using: string; image?: string; args?: string[]; steps?: CompositeStep[] };
}

interface CompositeStep {
  id?: string;
  uses?: string;
  with?: Record<string, string>;
}

const here = new URL('.', import.meta.url).pathname;
const rootActionPath = `${here}../../action.yml`;
const dockerActionPath = `${here}../action.yml`;

async function load<T>(path: string): Promise<T> {
  return parseYaml(await readFile(path, 'utf8')) as T;
}

describe('root action.yml (Marketplace entrypoint)', () => {
  it('declares the Marketplace metadata (name, description, branding)', async () => {
    const yml = await load<DockerActionYml>(rootActionPath);
    expect(yml.name).toBe('OAuthLint');
    expect(yml.description).toMatch(/OAuth/);
    expect(yml.branding?.icon).toBeTruthy();
    expect(yml.branding?.color).toBeTruthy();
  });

  it('is a composite action that delegates to the local ./action Docker action', async () => {
    const yml = await load<DockerActionYml>(rootActionPath);
    expect(yml.runs.using).toBe('composite');
    const steps = yml.runs.steps ?? [];
    const delegate = steps.find((s) => s.uses === './action');
    expect(delegate, 'expected a step with `uses: ./action`').toBeDefined();
    // The step needs an id so its outputs can be re-exposed.
    expect(delegate?.id).toBeTruthy();
  });

  it('mirrors the Docker action inputs and their defaults exactly', async () => {
    const root = await load<DockerActionYml>(rootActionPath);
    const docker = await load<DockerActionYml>(dockerActionPath);
    const rootInputs = root.inputs ?? {};
    const dockerInputs = docker.inputs ?? {};
    expect(Object.keys(rootInputs).sort()).toEqual(Object.keys(dockerInputs).sort());
    for (const [name, spec] of Object.entries(dockerInputs)) {
      expect(rootInputs[name]?.default, `default drift for input ${name}`).toBe(spec.default);
    }
  });

  it('mirrors the Docker action outputs and wires them to the delegated step', async () => {
    const root = await load<DockerActionYml>(rootActionPath);
    const docker = await load<DockerActionYml>(dockerActionPath);
    const rootOutputs = root.outputs ?? {};
    expect(Object.keys(rootOutputs).sort()).toEqual(Object.keys(docker.outputs ?? {}).sort());

    const stepId = (root.runs.steps ?? []).find((s) => s.uses === './action')?.id;
    for (const [name, spec] of Object.entries(rootOutputs)) {
      // Each root output must read from the delegated step's matching output.
      expect(spec.value, `output ${name} must reference steps.${stepId}.outputs.${name}`).toBe(
        `\${{ steps.${stepId}.outputs.${name} }}`,
      );
    }
  });

  it('passes every input through to the delegated step', async () => {
    const root = await load<DockerActionYml>(rootActionPath);
    const inputNames = Object.keys(root.inputs ?? {});
    const delegate = (root.runs.steps ?? []).find((s) => s.uses === './action');
    const withMap = delegate?.with ?? {};
    expect(Object.keys(withMap).sort()).toEqual(inputNames.sort());
    for (const name of inputNames) {
      expect(withMap[name], `input ${name} not forwarded`).toBe(`\${{ inputs.${name} }}`);
    }
  });

  it('forwards the new html input(s) and re-exposes the html-file output', async () => {
    const root = await load<DockerActionYml>(rootActionPath);
    // Inputs exist on the composite with the mirrored defaults.
    expect(root.inputs?.html?.default).toBe('false');
    expect(root.inputs?.['html-file']?.default).toBe('oauthlint-report.html');
    // They are forwarded to the delegated Docker action.
    const delegate = (root.runs.steps ?? []).find((s) => s.uses === './action');
    expect(delegate?.with?.html).toBe('${{ inputs.html }}');
    expect(delegate?.with?.['html-file']).toBe('${{ inputs.html-file }}');
    // And the html-file output is re-exposed from the delegated step.
    expect(root.outputs?.['html-file']?.value).toBe(
      `\${{ steps.${delegate?.id}.outputs.html-file }}`,
    );
  });
});
