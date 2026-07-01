import { AnthropicAdapter } from './anthropic.js';
import { MockAdapter } from './mock.js';
import { OpenAIAdapter } from './openai.js';
import type { ModelAdapter } from './types.js';

export type { ModelAdapter } from './types.js';
export { extractCode } from './types.js';
export { MockAdapter } from './mock.js';
export { AnthropicAdapter } from './anthropic.js';
export { OpenAIAdapter } from './openai.js';

/**
 * Factory per adapter key. The mock is offline and always available; the hosted
 * adapters read their API key lazily inside `generate`, so constructing one
 * without a key is fine (it only throws when actually asked to generate).
 */
const REGISTRY: Record<string, () => ModelAdapter> = {
  mock: () => new MockAdapter(),
  anthropic: () => new AnthropicAdapter(),
  openai: () => new OpenAIAdapter(),
};

/** The adapter keys the CLI understands. */
export const ADAPTER_KEYS = Object.keys(REGISTRY);

/**
 * Resolve a list of adapter keys to concrete adapters, preserving order and
 * dropping duplicates. Throws on an unknown key with the list of valid ones.
 */
export function resolveAdapters(keys: string[]): ModelAdapter[] {
  const seen = new Set<string>();
  const adapters: ModelAdapter[] = [];
  for (const raw of keys) {
    const key = raw.trim();
    if (!key || seen.has(key)) continue;
    const factory = REGISTRY[key];
    if (!factory) {
      throw new Error(
        `Unknown model adapter "${key}". Known adapters: ${ADAPTER_KEYS.join(', ')}.`,
      );
    }
    seen.add(key);
    adapters.push(factory());
  }
  if (adapters.length === 0) {
    throw new Error('No model adapters selected. Pass at least one with --models.');
  }
  return adapters;
}
