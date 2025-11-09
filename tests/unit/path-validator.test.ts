import { describe, it, expect } from 'vitest';
import { sanitizePath } from '../../src/security/path-validator.js';

describe('Path Validator', () => {
  const projectFolder = 'test-project';
  const basePath = 'Projects';

  describe('sanitizePath', () => {
    it('should sanitize valid relative paths', () => {
      const result = sanitizePath('docs/api.md', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/docs/api.md');
    });

    it('should handle simple filenames', () => {
      const result = sanitizePath('README.md', projectFolder, basePath);
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

    it('should handle nested directories', () => {
      const result = sanitizePath('docs/api/users.md', projectFolder, basePath);
      expect(result).toBe('Projects/test-project/docs/api/users.md');
    });
  });
});
