/**
 * Tests for tool-response utilities
 *
 * Verifies the MCP error handling helpers work correctly:
 * - toolSuccess() creates proper success responses
 * - toolError() creates error responses with isError: true
 * - isToolFailure() detects {success: false} patterns
 */

import { describe, it, expect } from 'vitest';
import { toolSuccess, toolError, isToolFailure } from '../../src/tools/utils/tool-response.js';

describe('Tool Response Utilities', () => {
  describe('toolSuccess', () => {
    it('should return CallToolResult with content array', () => {
      const result = toolSuccess({ message: 'hello' });

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBe(1);
    });

    it('should not include isError for success responses', () => {
      const result = toolSuccess({ success: true });

      expect(result.isError).toBeUndefined();
    });

    it('should JSON stringify object data', () => {
      const data = { path: '/test.md', content: 'hello' };
      const result = toolSuccess(data);

      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toBe(JSON.stringify(data, null, 2));
    });

    it('should pass through string data as-is', () => {
      const data = 'plain text response';
      const result = toolSuccess(data);

      expect(result.content[0].text).toBe(data);
    });

    it('should handle null and undefined', () => {
      expect(() => toolSuccess(null)).not.toThrow();
      expect(() => toolSuccess(undefined)).not.toThrow();
    });

    it('should handle arrays', () => {
      const data = [1, 2, 3];
      const result = toolSuccess(data);

      expect(result.content[0].text).toBe(JSON.stringify(data, null, 2));
    });
  });

  describe('toolError', () => {
    it('should return CallToolResult with isError: true', () => {
      const result = toolError('Something went wrong');

      expect(result.isError).toBe(true);
    });

    it('should include error message in content', () => {
      const result = toolError('File not found');
      const content = result.content[0] as { type: string; text: string };
      const parsed = JSON.parse(content.text);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('File not found');
    });

    it('should merge additional details into response', () => {
      const result = toolError('File not found', { path: '/missing.md', code: 404 });
      const content = result.content[0] as { type: string; text: string };
      const parsed = JSON.parse(content.text);

      expect(parsed.success).toBe(false);
      expect(parsed.error).toBe('File not found');
      expect(parsed.path).toBe('/missing.md');
      expect(parsed.code).toBe(404);
    });

    it('should have text content type', () => {
      const result = toolError('Error');

      expect(result.content[0].type).toBe('text');
    });

    it('should work without additional details', () => {
      const result = toolError('Simple error');
      const content = result.content[0] as { type: string; text: string };
      const parsed = JSON.parse(content.text);

      expect(Object.keys(parsed)).toEqual(['success', 'error']);
    });
  });

  describe('isToolFailure', () => {
    it('should return true for {success: false}', () => {
      const json = JSON.stringify({ success: false, error: 'Failed' });

      expect(isToolFailure(json)).toBe(true);
    });

    it('should return false for {success: true}', () => {
      const json = JSON.stringify({ success: true, data: 'ok' });

      expect(isToolFailure(json)).toBe(false);
    });

    it('should return false for objects without success field', () => {
      const json = JSON.stringify({ data: 'hello', status: 'ok' });

      expect(isToolFailure(json)).toBe(false);
    });

    it('should return false for invalid JSON', () => {
      expect(isToolFailure('not json')).toBe(false);
      expect(isToolFailure('{invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isToolFailure('')).toBe(false);
    });

    it('should return false for non-object JSON values', () => {
      expect(isToolFailure('"string"')).toBe(false);
      expect(isToolFailure('123')).toBe(false);
      expect(isToolFailure('true')).toBe(false);
      expect(isToolFailure('null')).toBe(false);
    });

    it('should handle success: false with any falsy value correctly', () => {
      // success: 0 should not be treated as failure
      expect(isToolFailure(JSON.stringify({ success: 0 }))).toBe(false);
      // success: "" should not be treated as failure
      expect(isToolFailure(JSON.stringify({ success: '' }))).toBe(false);
      // success: null should not be treated as failure
      expect(isToolFailure(JSON.stringify({ success: null }))).toBe(false);
      // Only explicit false
      expect(isToolFailure(JSON.stringify({ success: false }))).toBe(true);
    });
  });

  describe('Integration: LLM visibility', () => {
    it('toolError should produce response that LLM can distinguish from success', () => {
      const successResult = toolSuccess({ path: '/note.md', content: 'hello' });
      const errorResult = toolError('File not found', { path: '/missing.md' });

      // LLM sees isError flag
      expect(successResult.isError).toBeUndefined();
      expect(errorResult.isError).toBe(true);

      // Both have readable content
      expect(typeof successResult.content[0].text).toBe('string');
      expect(typeof errorResult.content[0].text).toBe('string');
    });

    it('isToolFailure should detect errors returned by tools using success pattern', () => {
      // Simulate delete-note returning error
      const deleteError = JSON.stringify({
        success: false,
        error: 'Cannot delete: File not found',
        path: '/missing.md',
      });

      // Simulate delete-note returning success
      const deleteSuccess = JSON.stringify({
        success: true,
        path: '/deleted.md',
        message: 'Note deleted successfully',
      });

      expect(isToolFailure(deleteError)).toBe(true);
      expect(isToolFailure(deleteSuccess)).toBe(false);
    });
  });
});
