/**
 * Tool Response Utilities
 *
 * Helpers for creating consistent MCP tool responses with proper error handling.
 *
 * Per MCP specification:
 * - Tool-level errors (file not found, permission denied, etc.) should return
 *   `isError: true` so LLMs can see the error and self-correct.
 * - Protocol-level errors (tool not found, invalid params schema) should throw McpError.
 *
 * @see https://spec.modelcontextprotocol.io/
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Create a successful tool response
 *
 * @param data - The response data (string or object to be JSON stringified)
 * @returns CallToolResult with content array
 *
 * @example
 * ```typescript
 * return toolSuccess({ path: '/docs/readme.md', content: '...' });
 * ```
 */
export function toolSuccess(data: unknown): CallToolResult {
  const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  return {
    content: [{ type: 'text' as const, text }],
  };
}

/**
 * Create a tool error response
 *
 * Use this for tool-level errors where the tool executed but the operation failed.
 * The LLM will see `isError: true` and can attempt to self-correct.
 *
 * @param message - Error message describing what went wrong
 * @param details - Optional additional details to include in the response
 * @returns CallToolResult with isError: true
 *
 * @example
 * ```typescript
 * return toolError('File not found', { path: '/docs/missing.md' });
 * ```
 */
export function toolError(message: string, details?: Record<string, unknown>): CallToolResult {
  const errorData = { success: false, error: message, ...details };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(errorData, null, 2) }],
    isError: true,
  };
}

/**
 * Check if a JSON result string indicates a tool failure
 *
 * Detects the `{ success: false }` pattern used by some tools.
 * Used in index.ts to set `isError: true` for tools that return failure JSON.
 *
 * @param jsonResult - JSON string result from a tool handler
 * @returns true if the result indicates failure
 *
 * @example
 * ```typescript
 * const result = await deleteNote(input);
 * return {
 *   content: [{ type: 'text', text: result }],
 *   isError: isToolFailure(result),
 * };
 * ```
 */
export function isToolFailure(jsonResult: string): boolean {
  try {
    const parsed = JSON.parse(jsonResult);
    return parsed.success === false;
  } catch {
    return false;
  }
}
