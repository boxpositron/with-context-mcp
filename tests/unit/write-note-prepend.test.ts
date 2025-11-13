/**
 * Write Note Prepend Mode Tests
 *
 * Comprehensive tests for the prepend mode feature in write_note tool.
 * Tests schema validation, read-before-write enforcement, and edge cases.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeNote, writeNoteSchema } from '../../src/tools/write-note.js';
import { ObsidianClient } from '../../src/obsidian/client.js';
import { sessionState } from '../../src/session-state.js';
import { WriteMode } from '../../src/types/index.js';
import { ObsidianApiError, ObsidianNotFoundError } from '../../src/obsidian/types.js';

// Mock modules
vi.mock('../../src/obsidian/client.js');
vi.mock('../../src/config/index.js', () => ({
  config: {
    obsidianApiUrl: 'https://127.0.0.1:27124',
    obsidianApiKey: 'test-key',
    obsidianVault: 'TestVault',
    projectBasePath: 'Projects',
    nodeEnv: 'test',
  },
}));

describe('Write Note - Prepend Mode', () => {
  let mockWriteNote: ReturnType<typeof vi.fn>;
  let mockReadNote: ReturnType<typeof vi.fn>;
  let mockNoteExists: ReturnType<typeof vi.fn>;
  const storage = new Map<string, string>();

  beforeEach(() => {
    // Clear storage and read tracking
    storage.clear();
    sessionState.clearReadTracking();

    // Set up project context
    sessionState.setProjectContext('test-project', 'Projects');

    // Mock ObsidianClient methods with proper prepend/append logic
    mockWriteNote = vi
      .fn()
      .mockImplementation(async (path: string, content: string, mode: WriteMode) => {
        // Enforce read-before-write for existing files
        if (mode === 'prepend' || mode === 'append' || mode === 'overwrite') {
          const fileExists = storage.has(path);
          if (fileExists && !sessionState.hasFileBeenRead(path)) {
            throw new ObsidianApiError(
              `Cannot write to existing file without reading it first. ` +
                `File: ${path}. Call readNote() before writeNote() for existing files.`
            );
          }
        }

        // Handle different write modes
        if (mode === 'prepend') {
          const existing = storage.get(path) || '';
          storage.set(path, content + existing);
        } else if (mode === 'append') {
          const existing = storage.get(path) || '';
          storage.set(path, existing + content);
        } else if (mode === 'create') {
          if (storage.has(path)) {
            throw new Error(`File already exists: ${path}`);
          }
          storage.set(path, content);
        } else {
          // overwrite
          storage.set(path, content);
        }
        return undefined;
      });

    mockReadNote = vi.fn().mockImplementation(async (path: string) => {
      if (storage.has(path)) {
        sessionState.markFileAsRead(path);
        return storage.get(path)!;
      }
      throw new ObsidianNotFoundError(`File not found: ${path}`);
    });

    mockNoteExists = vi.fn().mockImplementation(async (path: string) => {
      return storage.has(path);
    });

    // Apply mocks to ObsidianClient prototype
    vi.mocked(ObsidianClient.prototype.writeNote).mockImplementation(mockWriteNote);
    vi.mocked(ObsidianClient.prototype.readNote).mockImplementation(mockReadNote);
    vi.mocked(ObsidianClient.prototype.noteExists).mockImplementation(mockNoteExists);
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionState.clearReadTracking();
  });

  describe('Schema Validation', () => {
    it('should accept "prepend" as a valid mode', () => {
      const input = {
        path: 'test.md',
        content: 'New content',
        mode: 'prepend' as const,
      };

      const result = writeNoteSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('prepend');
      }
    });

    it('should include prepend in mode enum', () => {
      const validModes = ['create', 'overwrite', 'append', 'prepend'];

      // Test each valid mode
      validModes.forEach((mode) => {
        const result = writeNoteSchema.safeParse({
          path: 'test.md',
          content: 'content',
          mode,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid modes', () => {
      const input = {
        path: 'test.md',
        content: 'content',
        mode: 'invalid-mode',
      };

      const result = writeNoteSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should default to overwrite when mode is not specified', () => {
      const input = {
        path: 'test.md',
        content: 'content',
      };

      const result = writeNoteSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe('overwrite');
      }
    });
  });

  describe('Type System', () => {
    it('should include prepend in WriteMode type', () => {
      // This is a compile-time check, but we can verify at runtime
      const modes: WriteMode[] = ['create', 'overwrite', 'append', 'prepend'];

      modes.forEach((mode) => {
        expect(['create', 'overwrite', 'append', 'prepend']).toContain(mode);
      });
    });

    it('should allow prepend mode in function signature', () => {
      const mode: WriteMode = 'prepend';
      expect(mode).toBe('prepend');
    });
  });

  describe('Successful Prepend Operations', () => {
    it('should prepend content to an existing file', async () => {
      // Create initial file with full path
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original content\n');

      // Mark as read (required for prepend)
      sessionState.markFileAsRead(fullPath);

      const result = await writeNote({
        path: 'test.md',
        content: 'New content\n',
        mode: 'prepend',
      });

      expect(mockWriteNote).toHaveBeenCalledWith(fullPath, 'New content\n', 'prepend');
      expect(storage.get(fullPath)).toBe('New content\nOriginal content\n');

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.mode).toBe('prepend');
      expect(parsed.message).toContain('prepended to');
    });

    it('should handle multiple prepend operations', async () => {
      const fullPath = 'Projects/test-project/changelog.md';
      // Create initial file
      storage.set(fullPath, '## Version 1.0.0\n');

      // First prepend - read then write
      await mockReadNote(fullPath); // This marks as read
      await mockWriteNote(fullPath, '## Version 1.1.0\n', 'prepend');

      // Verify first prepend worked
      expect(storage.get(fullPath)).toBe('## Version 1.1.0\n## Version 1.0.0\n');

      // Second prepend - read then write
      await mockReadNote(fullPath); // This marks as read again
      await mockWriteNote(fullPath, '## Version 1.2.0\n', 'prepend');

      // Verify final state
      expect(storage.get(fullPath)).toBe('## Version 1.2.0\n## Version 1.1.0\n## Version 1.0.0\n');
    });

    it('should prepend to file with frontmatter', async () => {
      const fullPath = 'Projects/test-project/note.md';
      const originalContent = `---
title: Test Note
date: 2024-01-01
---

# Original Content`;

      storage.set(fullPath, originalContent);
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'note.md',
        content: '> Important update\n\n',
        mode: 'prepend',
      });

      const expected = `> Important update

${originalContent}`;
      expect(storage.get(fullPath)).toBe(expected);
    });

    it('should handle prepending empty content', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original content');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'test.md',
        content: '',
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe('Original content');
      expect(mockWriteNote).toHaveBeenCalledWith(fullPath, '', 'prepend');
    });
  });

  describe('Read-Before-Write Enforcement', () => {
    it('should enforce read-before-write for prepend mode', async () => {
      const fullPath = 'Projects/test-project/test.md';
      // Create file without reading it
      storage.set(fullPath, 'Original content');

      await expect(
        writeNote({
          path: 'test.md',
          content: 'New content',
          mode: 'prepend',
        })
      ).rejects.toThrow('Cannot write to existing file without reading it first');
    });

    it('should allow prepend after reading the file', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original content');

      // Read the file first
      await mockReadNote(fullPath);
      expect(sessionState.hasFileBeenRead(fullPath)).toBe(true);

      // Now prepend should work
      await expect(
        writeNote({
          path: 'test.md',
          content: 'New content\n',
          mode: 'prepend',
        })
      ).resolves.toBeDefined();
    });

    it('should track read status correctly for prepend operations', async () => {
      const fullPath1 = 'Projects/test-project/file1.md';
      const fullPath2 = 'Projects/test-project/file2.md';

      storage.set(fullPath1, 'Content 1');
      storage.set(fullPath2, 'Content 2');

      // Read only file1
      await mockReadNote(fullPath1);

      expect(sessionState.hasFileBeenRead(fullPath1)).toBe(true);
      expect(sessionState.hasFileBeenRead(fullPath2)).toBe(false);

      // Prepend to file1 should work
      await expect(
        writeNote({
          path: 'file1.md',
          content: 'Prepended',
          mode: 'prepend',
        })
      ).resolves.toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle prepending to empty file', async () => {
      const fullPath = 'Projects/test-project/empty.md';
      storage.set(fullPath, '');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'empty.md',
        content: 'First content\n',
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe('First content\n');
    });

    it('should handle prepending to whitespace-only file', async () => {
      const fullPath = 'Projects/test-project/whitespace.md';
      storage.set(fullPath, '   \n\n  \t\n');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'whitespace.md',
        content: '# Header\n',
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe('# Header\n   \n\n  \t\n');
    });

    it('should handle prepending large content', async () => {
      const fullPath = 'Projects/test-project/large.md';
      const largeContent = 'x'.repeat(10000);
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'large.md',
        content: largeContent,
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe(largeContent + 'Original');
    });

    it('should handle prepending with special characters', async () => {
      const fullPath = 'Projects/test-project/special.md';
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      const specialContent = '# Title with émojis 🎉\n**Bold** and *italic*\n```code```\n';

      await writeNote({
        path: 'special.md',
        content: specialContent,
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe(specialContent + 'Original');
    });

    it('should handle prepending with newlines and formatting', async () => {
      const fullPath = 'Projects/test-project/formatted.md';
      storage.set(fullPath, '## Section 2\nContent 2');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'formatted.md',
        content: '## Section 1\nContent 1\n\n',
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe('## Section 1\nContent 1\n\n## Section 2\nContent 2');
    });

    it('should handle path normalization for prepend', async () => {
      const fullPath = 'Projects/test-project/docs/test.md';
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'docs/test.md',
        content: 'Prepended\n',
        mode: 'prepend',
      });

      expect(mockWriteNote).toHaveBeenCalledWith(fullPath, 'Prepended\n', 'prepend');
    });
  });

  describe('Integration with Other Modes', () => {
    it('should differentiate prepend from append', async () => {
      const appendPath = 'Projects/test-project/append-test.md';
      const prependPath = 'Projects/test-project/prepend-test.md';

      // Test append
      storage.set(appendPath, 'Original');
      sessionState.markFileAsRead(appendPath);

      await writeNote({
        path: 'append-test.md',
        content: ' Appended',
        mode: 'append',
      });

      expect(storage.get(appendPath)).toBe('Original Appended');

      // Test prepend
      storage.set(prependPath, 'Original');
      sessionState.markFileAsRead(prependPath);

      await writeNote({
        path: 'prepend-test.md',
        content: 'Prepended ',
        mode: 'prepend',
      });

      expect(storage.get(prependPath)).toBe('Prepended Original');
    });

    it('should handle mode transitions correctly', async () => {
      const fullPath = 'Projects/test-project/transitions.md';

      // Create with create mode
      await writeNote({
        path: 'transitions.md',
        content: 'Initial',
        mode: 'create',
      });

      expect(storage.get(fullPath)).toBe('Initial');

      // Read it
      await mockReadNote(fullPath);

      // Prepend to it
      await writeNote({
        path: 'transitions.md',
        content: 'Prepended\n',
        mode: 'prepend',
      });

      expect(storage.get(fullPath)).toBe('Prepended\nInitial');

      // Read again
      await mockReadNote(fullPath);

      // Append to it
      await writeNote({
        path: 'transitions.md',
        content: '\nAppended',
        mode: 'append',
      });

      expect(storage.get(fullPath)).toBe('Prepended\nInitial\nAppended');
    });
  });

  describe('Error Handling', () => {
    it('should provide clear error message for prepend without read', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Content');

      await expect(
        writeNote({
          path: 'test.md',
          content: 'New',
          mode: 'prepend',
        })
      ).rejects.toThrow(/Cannot write to existing file without reading it first/);
    });

    it('should handle API errors during prepend', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Content');
      sessionState.markFileAsRead(fullPath);

      mockWriteNote.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        writeNote({
          path: 'test.md',
          content: 'New',
          mode: 'prepend',
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Response Format', () => {
    it('should return correct success message for prepend', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      const result = await writeNote({
        path: 'test.md',
        content: 'New',
        mode: 'prepend',
      });

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);
      expect(parsed.mode).toBe('prepend');
      expect(parsed.message).toBe('Note prepended to successfully');
      expect(parsed.path).toBe(fullPath);
      expect(parsed.project_folder).toBe('test-project');
    });

    it('should include project context in response', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      const result = await writeNote({
        path: 'test.md',
        content: 'New',
        mode: 'prepend',
      });

      const parsed = JSON.parse(result);
      expect(parsed.project_folder).toBeDefined();
      expect(parsed.project_folder).toBe('test-project');
    });
  });

  describe('ObsidianClient Integration', () => {
    it('should call ObsidianClient.writeNote with prepend mode', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'test.md',
        content: 'New content',
        mode: 'prepend',
      });

      expect(mockWriteNote).toHaveBeenCalledWith(fullPath, 'New content', 'prepend');
      expect(mockWriteNote).toHaveBeenCalledTimes(1);
    });

    it('should verify read-before-write enforcement is checked', async () => {
      const fullPath = 'Projects/test-project/test.md';
      storage.set(fullPath, 'Original');
      sessionState.markFileAsRead(fullPath);

      await writeNote({
        path: 'test.md',
        content: 'New',
        mode: 'prepend',
      });

      // The mock implementation checks hasFileBeenRead internally
      // Verify the write succeeded (which means enforcement passed)
      expect(mockWriteNote).toHaveBeenCalled();
      expect(storage.get(fullPath)).toBe('NewOriginal');
    });
  });
});
