import { describe, it, expect } from 'vitest';
import { sanitizePath } from '../../src/security/path-validator.js';

describe('Path Validator', () => {
  const projectFolder = 'test-project';
  const basePath = 'Projects';

  describe('sanitizePath', () => {
    it('should sanitize valid relative paths at vault root', () => {
      const result = sanitizePath('docs/api.md', projectFolder, basePath);
      // Files are now created at vault root level, not nested under basePath/projectFolder
      expect(result).toBe('docs/api.md');
    });

    it('should handle simple filenames at vault root', () => {
      const result = sanitizePath('README.md', projectFolder, basePath);
      // Files are now created at vault root level
      expect(result).toBe('README.md');
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

    it('should handle nested directories at vault root', () => {
      const result = sanitizePath('docs/api/users.md', projectFolder, basePath);
      // Files are now created at vault root level
      expect(result).toBe('docs/api/users.md');
    });
  });
});
