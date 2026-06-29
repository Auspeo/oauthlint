/**
 * An expected, user-facing failure (unknown rule, missing path, oversized
 * input). The server turns these into a clean MCP tool error the calling agent
 * can read and act on, rather than crashing the transport. Programmer errors
 * and unexpected failures are surfaced too, but as their raw message.
 */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}
