import type { ModelAdapter } from './types.js';

const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const DEFAULT_MODEL = 'gpt-4o';

const SYSTEM_PROMPT =
  'You are a coding assistant. Respond with only the requested source code. ' +
  'Do not add explanations. A single fenced code block is fine.';

export interface OpenAIAdapterOptions {
  /** Model id to request. */
  model?: string;
  /** Column label in reports. Defaults to the model id. */
  id?: string;
  /** Cap on generated tokens. */
  maxTokens?: number;
}

interface OpenAIChoice {
  message?: { content?: string };
}

interface OpenAIResponse {
  choices?: OpenAIChoice[];
}

/**
 * Adapter for OpenAI's Chat Completions API. Requires `OPENAI_API_KEY` in the
 * environment; it throws a clear error if the key is absent, so a run without
 * credentials fails fast. Uses the Node 20+ global `fetch`; no HTTP-client
 * dependency.
 */
export class OpenAIAdapter implements ModelAdapter {
  readonly id: string;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor(options: OpenAIAdapterOptions = {}) {
    this.model = options.model ?? DEFAULT_MODEL;
    this.id = options.id ?? this.model;
    this.maxTokens = options.maxTokens ?? 2048;
  }

  async generate(prompt: string): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Export it to run the OpenAI adapter, or use --models mock for an offline run.',
      );
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`OpenAI API request failed (${res.status}): ${detail.slice(0, 500)}`);
    }

    const data = (await res.json()) as OpenAIResponse;
    const text = data.choices?.[0]?.message?.content ?? '';
    if (!text) {
      throw new Error('OpenAI API returned no message content.');
    }
    return text;
  }
}
