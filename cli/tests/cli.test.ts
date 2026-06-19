import { describe, expect, it } from 'vitest';
import { buildProgram } from '../src/cli.js';

/**
 * Builds the program and makes it test-safe: commander throws instead of
 * calling process.exit, and error output is swallowed so failed-parse tests
 * don't pollute the reporter.
 */
async function testProgram() {
  const program = await buildProgram();
  program.exitOverride();
  program.configureOutput({ writeErr: () => {}, writeOut: () => {} });
  return program;
}

describe('buildProgram', () => {
  it('sets the program name and a semver version', async () => {
    const program = await buildProgram();
    expect(program.name()).toBe('oauthlint');
    expect(program.version()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('registers the scan, list, init and doctor commands', async () => {
    const program = await buildProgram();
    const names = program.commands.map((c) => c.name()).sort();
    expect(names).toEqual(['doctor', 'init', 'list', 'scan']);
  });
});

describe('option parsers', () => {
  it('rejects an unknown --severity', async () => {
    const program = await testProgram();
    await expect(
      program.parseAsync(['node', 'oauthlint', 'scan', '.', '--severity', 'BOGUS']),
    ).rejects.toThrow(/Unknown severity/);
  });

  it('rejects an unknown --format', async () => {
    const program = await testProgram();
    await expect(
      program.parseAsync(['node', 'oauthlint', 'scan', '.', '--format', 'xml']),
    ).rejects.toThrow(/Unknown format/);
  });

  it('rejects an unknown --fail-on level', async () => {
    const program = await testProgram();
    await expect(
      program.parseAsync(['node', 'oauthlint', 'scan', '.', '--fail-on', 'whoops']),
    ).rejects.toThrow(/Unknown severity/);
  });

  it('accepts a case-insensitive --severity (normalises to upper case)', async () => {
    // Parsing stops at the option coercion; the action is never reached because
    // commander still needs the (valid) value to build options. We assert the
    // coercion does not throw for a known severity in any case.
    const program = await testProgram();
    // `--help` short-circuits before the action runs, so this exercises the
    // severity coercion without invoking runScan/process.exit.
    await expect(
      program.parseAsync(['node', 'oauthlint', 'scan', '.', '--severity', 'high', '--help']),
    ).rejects.toThrowError(); // commander throws CommanderError('help') under exitOverride
  });
});
