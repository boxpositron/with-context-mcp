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

    // Test rejection of filesystem-like paths
    describe('Filesystem path rejection', () => {
      it('should reject paths starting with Users/', () => {
        expect(() => sanitizePath('Users/davidibia/docs/api.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with home/', () => {
        expect(() => sanitizePath('home/user/documents/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject Windows drive letters (backslash)', () => {
        expect(() => sanitizePath('C:\\Users\\docs\\api.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject Windows drive letters (forward slash)', () => {
        expect(() => sanitizePath('C:/Users/docs/api.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with mnt/', () => {
        expect(() => sanitizePath('mnt/drive/docs/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with usr/', () => {
        expect(() => sanitizePath('usr/local/docs/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with var/', () => {
        expect(() => sanitizePath('var/www/docs/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with tmp/', () => {
        expect(() => sanitizePath('tmp/temp/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with Library/', () => {
        expect(() =>
          sanitizePath('Library/Application Support/file.md', projectFolder, basePath)
        ).toThrow(/Path appears to be an absolute filesystem path/);
      });

      it('should reject paths starting with Applications/', () => {
        expect(() => sanitizePath('Applications/MyApp/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with Windows/', () => {
        expect(() => sanitizePath('Windows/System32/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });

      it('should reject paths starting with Program Files', () => {
        expect(() => sanitizePath('Program Files/App/file.md', projectFolder, basePath)).toThrow(
          /Path appears to be an absolute filesystem path/
        );
      });
    });

    // Test acceptance of valid project-relative paths
    describe('Valid project-relative paths', () => {
      it('should accept simple filename', () => {
        const result = sanitizePath('README.md', projectFolder, basePath);
        expect(result).toBe('Projects/test-project/README.md');
      });

      it('should accept docs/api.md', () => {
        const result = sanitizePath('docs/api.md', projectFolder, basePath);
        expect(result).toBe('Projects/test-project/docs/api.md');
      });

      it('should accept guides/tutorial.md', () => {
        const result = sanitizePath('guides/tutorial.md', projectFolder, basePath);
        expect(result).toBe('Projects/test-project/guides/tutorial.md');
      });

      it('should accept nested paths like docs/api/users.md', () => {
        const result = sanitizePath('docs/api/users.md', projectFolder, basePath);
        expect(result).toBe('Projects/test-project/docs/api/users.md');
      });

      it('should accept CHANGELOG.md', () => {
        const result = sanitizePath('CHANGELOG.md', projectFolder, basePath);
        expect(result).toBe('Projects/test-project/CHANGELOG.md');
      });
    });

    // Test error messages are helpful
    describe('Error message quality', () => {
      it('should provide helpful error message for Users/ path', () => {
        let thrownError: Error | null = null;
        try {
          sanitizePath('Users/davidibia/Projects/my-project/docs/api.md', projectFolder, basePath);
        } catch (error) {
          thrownError = error as Error;
        }
        expect(thrownError).not.toBeNull();
        expect(thrownError?.message).toContain('Path appears to be an absolute filesystem path');
        expect(thrownError?.message).toContain('project-relative paths');
        expect(thrownError?.message).toMatch(/Suggested fix:/);
      });

      it('should provide helpful error message for absolute paths', () => {
        let thrownError: Error | null = null;
        try {
          sanitizePath('/Users/davidibia/docs/api.md', projectFolder, basePath);
        } catch (error) {
          thrownError = error as Error;
        }
        expect(thrownError).not.toBeNull();
        expect(thrownError?.message).toContain('Absolute paths are not allowed');
        expect(thrownError?.message).toContain('docs/api.md');
        expect(thrownError?.message).toContain('README.md');
        expect(thrownError?.message).toMatch(/Suggested fix:/);
      });
    });
  });
});
