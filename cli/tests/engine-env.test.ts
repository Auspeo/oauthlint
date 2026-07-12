import { describe, expect, it } from 'vitest';
import { engineEnv } from '../src/adapters/semgrep.js';

describe('engineEnv', () => {
  it('forces C.UTF-8 and PYTHONUTF8 when no UTF-8 locale is present', () => {
    const env = engineEnv({ PATH: '/x' });
    expect(env.LANG).toBe('C.UTF-8');
    expect(env.LC_ALL).toBe('C.UTF-8');
    expect(env.PYTHONUTF8).toBe('1');
  });

  it('respects an existing UTF-8 locale and only adds PYTHONUTF8', () => {
    const env = engineEnv({ LANG: 'en_US.UTF-8' });
    expect(env.LANG).toBe('en_US.UTF-8');
    expect(env.LC_ALL).toBeUndefined();
    expect(env.PYTHONUTF8).toBe('1');
  });

  it('honors LC_ALL precedence: a non-UTF-8 LC_ALL is overridden even if LANG is UTF-8', () => {
    const env = engineEnv({ LANG: 'en_US.UTF-8', LC_ALL: 'C' });
    expect(env.LANG).toBe('C.UTF-8');
    expect(env.LC_ALL).toBe('C.UTF-8');
  });

  it('preserves the rest of the environment', () => {
    const env = engineEnv({ PATH: '/x', FOO: 'bar' });
    expect(env.PATH).toBe('/x');
    expect(env.FOO).toBe('bar');
  });
});
