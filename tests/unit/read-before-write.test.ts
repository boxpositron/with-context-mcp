import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { sessionState } from '../../src/session-state.js';

describe('Read-before-write enforcement', () => {
  beforeEach(() => {
    // Clear read tracking before each test
    sessionState.clearReadTracking();
  });

  afterEach(() => {
    // Clean up after each test
    sessionState.clearReadTracking();
  });

  describe('SessionState read tracking', () => {
    it('should mark a file as read', () => {
      const path = 'docs/test.md';
      sessionState.markFileAsRead(path);
      expect(sessionState.hasFileBeenRead(path)).toBe(true);
    });

    it('should return false for files that have not been read', () => {
      const path = 'docs/unread.md';
      expect(sessionState.hasFileBeenRead(path)).toBe(false);
    });

    it('should normalize paths (remove leading slash)', () => {
      sessionState.markFileAsRead('/docs/test.md');
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(true);
    });

    it('should normalize paths (add .md extension)', () => {
      sessionState.markFileAsRead('docs/test');
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(true);
    });

    it('should normalize paths (case insensitive)', () => {
      sessionState.markFileAsRead('docs/Test.md');
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(true);
    });

    it('should handle complex path normalization', () => {
      sessionState.markFileAsRead('/Docs/TEST');
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(true);
    });

    it('should clear read tracking', () => {
      sessionState.markFileAsRead('docs/test.md');
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(true);

      sessionState.clearReadTracking();
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(false);
    });

    it('should track multiple files independently', () => {
      sessionState.markFileAsRead('docs/file1.md');
      sessionState.markFileAsRead('docs/file2.md');

      expect(sessionState.hasFileBeenRead('docs/file1.md')).toBe(true);
      expect(sessionState.hasFileBeenRead('docs/file2.md')).toBe(true);
      expect(sessionState.hasFileBeenRead('docs/file3.md')).toBe(false);
    });

    it('should handle paths with subdirectories', () => {
      sessionState.markFileAsRead('docs/api/endpoints/users.md');
      expect(sessionState.hasFileBeenRead('docs/api/endpoints/users.md')).toBe(true);
    });
  });

  describe('SessionState integration with project context', () => {
    it('should maintain read tracking independent of project context', () => {
      sessionState.setProjectContext('project-a', 'Projects');
      sessionState.markFileAsRead('docs/test.md');

      // Change project context
      sessionState.setProjectContext('project-b', 'Projects');

      // Read tracking should persist across context changes
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(true);
    });

    it('should clear read tracking without affecting project context', () => {
      sessionState.setProjectContext('my-project', 'Projects');
      sessionState.markFileAsRead('docs/test.md');

      sessionState.clearReadTracking();

      // Context should still be set
      const context = sessionState.getCurrentContext();
      expect(context).not.toBeNull();
      expect(context?.projectFolder).toBe('my-project');

      // But read tracking should be cleared
      expect(sessionState.hasFileBeenRead('docs/test.md')).toBe(false);
    });
  });

  describe('Multiple SessionState instances (edge case)', () => {
    it('should use singleton pattern (same instance)', () => {
      const instance1 = sessionState;
      const instance2 = sessionState;

      instance1.markFileAsRead('test.md');
      expect(instance2.hasFileBeenRead('test.md')).toBe(true);
    });
  });
});
