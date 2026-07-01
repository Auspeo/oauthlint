import type { ModelAdapter } from './types.js';

const ENDPOINT = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-5';

const SYSTEM_PROMPT =
  'You are a coding assistant. Respond with only the requested source code. ' +
  'Do not add explanations. A single fenced code block is fine.';

export interface AnthropicAdapterOptions {
  /** Model id to request. Defaults to a current Sonnet. */
  model?: string;
  /** Column label in reports. Defaults to `claude-sonnet`. */
  id?: string;
  /** Cap on generated tokens. */
  maxTokens?: number;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

/**
 * Adapter for Anthropic's Messages API. Requires `ANTHROPIC_API_KEY` in the
 * environment; it throws a clear error if the key is absent, so a run without
 * credentials fails fast instead of making an unauthenticated request. Uses the
 * Node 20+ global `fetch`; no HTTP-client dependency.
 */
export class AnthropicAdapter implements ModelAdapter {
  readonly id: string;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(options: AnthropicAdapterOptions = {}) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.id = options.id ?? 'claude-sonnet';
    this.maxTokens = options.maxTokens ?? 2048;
  }

  async generate(prompt: string): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Export it to run the Anthropic adapter, or use --models mock for an offline run.',
      );
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Anthropic API request failed (${res.status}): ${detail.slice(0, 500)}`);
    }

    const data = (await res.json()) as AnthropicResponse;
    const text = (data.content ?? [])
      .filter((block) => block.type === 'text' && typeof block.text === 'string')
      .map((block) => block.text)
      .join('');

    if (!text) {
      throw new Error('Anthropic API returned no text content.');
    }
    return text;
  }
}
