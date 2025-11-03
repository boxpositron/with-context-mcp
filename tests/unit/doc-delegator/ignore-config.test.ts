/**
 * Tests for IgnoreConfig
 * Tests singleton pattern, file loading, missing file handling, error cases, and reload functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IgnoreConfig } from '../../../src/doc-delegator/ignore-config';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

describe('IgnoreConfig', () => {
  let testDir: string;
  let ignoreFilePath: string;

  beforeEach(async () => {
    // Reset singleton before each test
    IgnoreConfig.resetInstance();

    // Create temporary test directory
    testDir = path.join(tmpdir(), `ignore-config-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    ignoreFilePath = path.join(testDir, '.withcontextignore');
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Reset singleton after each test
    IgnoreConfig.resetInstance();
  });

  describe('Singleton Pattern', () => {
    it('should create singleton instance with projectRoot', () => {
      const config = IgnoreConfig.getInstance(testDir);
      expect(config).toBeDefined();
      expect(config.getProjectRoot()).toBe(testDir);
    });

    it('should return same instance on subsequent calls', () => {
      const config1 = IgnoreConfig.getInstance(testDir);
      const config2 = IgnoreConfig.getInstance();
      expect(config1).toBe(config2);
    });

    it('should throw error if getInstance called without projectRoot on first call', () => {
      expect(() => IgnoreConfig.getInstance()).toThrow(
        'IgnoreConfig.getInstance() requires projectRoot parameter for first call'
      );
    });

    it('should create new instance if projectRoot changes', () => {
      const config1 = IgnoreConfig.getInstance(testDir);
      const testDir2 = path.join(tmpdir(), `ignore-config-test-2-${Date.now()}`);
      const config2 = IgnoreConfig.getInstance(testDir2);

      expect(config1).not.toBe(config2);
      expect(config1.getProjectRoot()).toBe(testDir);
      expect(config2.getProjectRoot()).toBe(testDir2);
    });

    it('should reset instance with resetInstance()', () => {
      IgnoreConfig.getInstance(testDir);
      IgnoreConfig.resetInstance();

      expect(() => IgnoreConfig.getInstance()).toThrow();
    });
  });

  describe('File Loading', () => {
    it('should load valid .withcontextignore file', async () => {
      const content = `
# Test patterns
*.md
!README.md
docs/
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.isLoaded()).toBe(true);
      expect(config.hasIgnoreFile()).toBe(true);

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(true);
      expect(matcher.isIgnored('test.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
    });

    it('should handle missing .withcontextignore file (backwards compatible)', async () => {
      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.isLoaded()).toBe(true);
      expect(config.hasIgnoreFile()).toBe(false);

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(false);
    });

    it('should handle empty .withcontextignore file', async () => {
      await fs.writeFile(ignoreFilePath, '', 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.isLoaded()).toBe(true);
      expect(config.hasIgnoreFile()).toBe(true);

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(false);
    });

    it('should handle file with only comments and blank lines', async () => {
      const content = `
# Comment 1
# Comment 2

# Comment 3
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.isLoaded()).toBe(true);
      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(false);
    });

    it('should load patterns with various formats', async () => {
      const content = `
# Markdown files
*.md
!README.md
!CHANGELOG.md

# Directories
docs/
/node_modules/

# Specific files
/LICENSE
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      const matcher = config.getMatcherSync();
      const patterns = matcher.getPatterns();

      expect(patterns.ignore).toContain('*.md');
      expect(patterns.ignore).toContain('docs/');
      expect(patterns.ignore).toContain('/node_modules/');
      expect(patterns.ignore).toContain('/LICENSE');
      expect(patterns.include).toContain('README.md');
      expect(patterns.include).toContain('CHANGELOG.md');
    });
  });

  describe('Error Handling', () => {
    it('should handle permission denied errors gracefully', async () => {
      // Create file
      await fs.writeFile(ignoreFilePath, '*.md', 'utf-8');

      // Mock fs.readFile to throw EACCES error
      const mockReadFile = vi.spyOn(fs, 'readFile');
      mockReadFile.mockRejectedValueOnce(
        Object.assign(new Error('Permission denied'), { code: 'EACCES' })
      );

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.isLoaded()).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cannot read .withcontextignore file (permission denied)')
      );

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(false);

      consoleWarnSpy.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should handle other file read errors gracefully', async () => {
      // Create file
      await fs.writeFile(ignoreFilePath, '*.md', 'utf-8');

      // Mock fs.readFile to throw generic error
      const mockReadFile = vi.spyOn(fs, 'readFile');
      mockReadFile.mockRejectedValueOnce(new Error('Unknown error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.isLoaded()).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error reading .withcontextignore file')
      );

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(false);

      consoleWarnSpy.mockRestore();
      mockReadFile.mockRestore();
    });

    it('should throw error when accessing matcher sync before loading', () => {
      const config = IgnoreConfig.getInstance(testDir);

      expect(() => config.getMatcherSync()).toThrow(
        'Ignore patterns not loaded. Call loadIgnoreFile() or getMatcher() first.'
      );
    });
  });

  describe('Reload Functionality', () => {
    it('should reload patterns when file is modified', async () => {
      // Create initial file
      await fs.writeFile(ignoreFilePath, '*.md', 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      let matcher = config.getMatcherSync();
      expect(matcher.isIgnored('test.md')).toBe(true);
      expect(matcher.isIgnored('test.txt')).toBe(false);

      // Modify file
      await fs.writeFile(ignoreFilePath, '*.txt', 'utf-8');

      // Reload
      await config.reload();

      matcher = config.getMatcherSync();
      expect(matcher.isIgnored('test.md')).toBe(false);
      expect(matcher.isIgnored('test.txt')).toBe(true);
    });

    it('should reload after file is deleted', async () => {
      // Create file
      await fs.writeFile(ignoreFilePath, '*.md', 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.hasIgnoreFile()).toBe(true);

      // Delete file
      await fs.unlink(ignoreFilePath);

      // Reload
      await config.reload();

      expect(config.hasIgnoreFile()).toBe(false);
      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(false);
    });

    it('should reload after file is created', async () => {
      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      expect(config.hasIgnoreFile()).toBe(false);

      // Create file
      await fs.writeFile(ignoreFilePath, '*.md', 'utf-8');

      // Reload
      await config.reload();

      expect(config.hasIgnoreFile()).toBe(true);
      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(true);
      expect(matcher.isIgnored('test.md')).toBe(true);
    });
  });

  describe('getMatcher() - Async', () => {
    it('should auto-load patterns if not loaded', async () => {
      const content = '*.md\n!README.md';
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      expect(config.isLoaded()).toBe(false);

      const matcher = await config.getMatcher();
      expect(config.isLoaded()).toBe(true);
      expect(matcher.hasPatterns()).toBe(true);
    });

    it('should return cached matcher if already loaded', async () => {
      const content = '*.md';
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      const matcher1 = await config.getMatcher();
      const matcher2 = await config.getMatcher();

      expect(matcher1).toBe(matcher2);
    });
  });

  describe('Getters', () => {
    it('should return correct ignore file path', () => {
      const config = IgnoreConfig.getInstance(testDir);
      expect(config.getIgnoreFilePath()).toBe(ignoreFilePath);
    });

    it('should return correct project root', () => {
      const config = IgnoreConfig.getInstance(testDir);
      expect(config.getProjectRoot()).toBe(testDir);
    });

    it('should return correct loaded state', async () => {
      const config = IgnoreConfig.getInstance(testDir);
      expect(config.isLoaded()).toBe(false);

      await config.loadIgnoreFile();
      expect(config.isLoaded()).toBe(true);
    });

    it('should return correct hasIgnoreFile state', async () => {
      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();
      expect(config.hasIgnoreFile()).toBe(false);

      // Create file
      await fs.writeFile(ignoreFilePath, '*.md', 'utf-8');
      await config.reload();
      expect(config.hasIgnoreFile()).toBe(true);
    });
  });

  describe('Integration with IgnorePatternMatcher', () => {
    it('should correctly delegate to matcher for pattern matching', async () => {
      const content = `
# Ignore all markdown at any level
**/*.md

# But include these
!README.md
!CHANGELOG.md

# Ignore docs directory
docs/

# Ignore specific file at root
/LICENSE
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      const matcher = await config.getMatcher();

      // Test various patterns
      expect(matcher.isIgnored('test.md')).toBe(true);
      expect(matcher.isIgnored('subdir/test.md')).toBe(true);
      expect(matcher.isIgnored('README.md')).toBe(false);
      expect(matcher.isIgnored('CHANGELOG.md')).toBe(false);
      expect(matcher.isIgnored('docs/api.md')).toBe(true);
      expect(matcher.isIgnored('LICENSE')).toBe(true);
      expect(matcher.isIgnored('subdir/LICENSE')).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid pattern gracefully', async () => {
      const content = `
*.md
[invalid
*.txt
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      const matcher = config.getMatcherSync();
      // Should have loaded valid patterns
      expect(matcher.hasPatterns()).toBe(true);
    });

    it('should handle very long file', async () => {
      const lines: string[] = [];
      for (let i = 0; i < 1000; i++) {
        lines.push(`pattern-${i}/*`);
      }
      await fs.writeFile(ignoreFilePath, lines.join('\n'), 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(true);
      expect(matcher.getPatternCount()).toBe(1000);
    });

    it('should handle unicode patterns', async () => {
      const content = `
# Unicode patterns
文档/*
📁docs/
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(true);
    });

    it('should handle patterns with special characters', async () => {
      const content = `
# Patterns with special chars
*.md
**/*.txt
docs/**/*
[abc].md
test?.md
`;
      await fs.writeFile(ignoreFilePath, content, 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);
      await config.loadIgnoreFile();

      const matcher = config.getMatcherSync();
      expect(matcher.hasPatterns()).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should load large file quickly', async () => {
      const lines: string[] = [];
      for (let i = 0; i < 10000; i++) {
        lines.push(`# Comment ${i}`);
        lines.push(`pattern-${i}/*.md`);
      }
      await fs.writeFile(ignoreFilePath, lines.join('\n'), 'utf-8');

      const config = IgnoreConfig.getInstance(testDir);

      const start = Date.now();
      await config.loadIgnoreFile();
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should load in < 1 second
      expect(config.isLoaded()).toBe(true);
    });
  });
});
