import { describe, it, expect } from 'vitest';
import { sanitizePath } from '../../src/security/path-validator.js';

describe('Path Validator', () => {
  const projectFolder = 'test-project';
  const basePath = 'Projects';

  describe('sanitizePath', () => {
    it('should sanitize valid relative paths under project folder', () => {
      const result = sanitizePath('docs/api.md', projectFolder, basePath);
      // Files are created under basePath/projectFolder
      expect(result).toBe('Projects/test-project/docs/api.md');
    });

    it('should handle simple filenames under project folder', () => {
      const result = sanitizePath('README.md', projectFolder, basePath);
      // Files are created under basePath/projectFolder
      expect(result).toBe('Projects/test-project/README.md');
    });

    it('should reject paths with directory traversal', () => {
      expect(() => sanitizePath('../etc/passwd', projectFolder, basePath)).toThrow();
    });

    it('should reject absolute paths', () => {
      expect(() => sanitizePath('/etc/passwd', projectFolder, basePath)).toThrow();
    });

    it('should reject empty paths', () => {
      expect(() => sanitizePath('', projectFolder, basePath)).toThrow(
        'Path must be a non-empty string'
      );
    });

    it('should handle nested directories under project folder', () => {
      const result = sanitizePath('docs/api/users.md', projectFolder, basePath);
      // Files are created under basePath/projectFolder
      expect(result).toBe('Projects/test-project/docs/api/users.md');
    });

    it('should slugify filenames with spaces', () => {
      const result = sanitizePath('My Notes File', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/my-notes-file.md');
    });

    it('should slugify filenames with special characters', () => {
      const result = sanitizePath('Notes & Ideas!', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/notes-ideas.md');
    });

    it('should slugify filenames with multiple spaces', () => {
      const result = sanitizePath('Release   Notes   v3.0.4', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/release-notes-v3-0-4.md');
    });

    it('should preserve directory structure but slugify filename', () => {
      const result = sanitizePath('docs/My API Reference', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/docs/my-api-reference.md');
    });

    it('should handle filenames that already have .md extension', () => {
      const result = sanitizePath('My Notes.md', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/my-notes.md');
    });

    it('should preserve case for well-known filenames like README', () => {
      const result = sanitizePath('README', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/README.md');
    });

    it('should convert regular filenames to lowercase', () => {
      const result = sanitizePath('MyFile', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/myfile.md');
    });
  });
});
