/**
 * A model adapter turns a prompt into generated source code. Every backend
 * (mock, hosted API, ...) implements the same tiny contract so the runner can
 * treat them interchangeably.
 */
export interface ModelAdapter {
  /** Stable identifier used as the model's column in reports. */
  id: string;
  /** Produce code for a prompt. May reject if the backend is unavailable. */
  generate(prompt: string): Promise<string>;
}

/**
 * Pull the first fenced code block out of a model response. Models usually wrap
 * code in a ```lang ... ``` fence, sometimes with prose around it; we want just
 * the code so the scanner parses real source rather than markdown. If there is
 * no fence, the whole (trimmed) text is returned unchanged.
 */
export function extractCode(markdown: string): string {
  // Match the first fenced block: an opening ``` with an optional info string,
  // then everything up to the closing ```.
  const fence = /```[^\n]*\n([\s\S]*?)```/.exec(markdown);
  if (fence?.[1] !== undefined) {
    return fence[1].replace(/\n+$/, '\n');
  }
  return markdown.trim();
}
