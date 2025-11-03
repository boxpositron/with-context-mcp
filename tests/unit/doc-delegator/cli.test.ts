/**
 * Unit tests for DelegationCLI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs, Dirent } from 'fs';
import path from 'path';
import { DelegationCLI, executeCommand } from '../../../src/doc-delegator/cli.js';
import { IgnoreConfig } from '../../../src/doc-delegator/ignore-config.js';
import { VaultCache } from '../../../src/doc-delegator/vault-cache.js';

// Mock fs module
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    readdir: vi.fn(),
  },
}));

describe('DelegationCLI', () => {
  const projectRoot = '/test/project';
  let cli: DelegationCLI;

  beforeEach(() => {
    cli = new DelegationCLI(projectRoot);
    IgnoreConfig.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    IgnoreConfig.resetInstance();
  });

  describe('createWithContextIgnore', () => {
    it('should create .withcontextignore file from template', async () => {
      // Mock: file doesn't exist
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));

      // Mock: template file exists
      const templateContent = '# Template content\n*.md\n';
      vi.mocked(fs.readFile).mockResolvedValueOnce(templateContent);

      // Mock: writeFile succeeds
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const result = await cli.createWithContextIgnore();

      expect(result.success).toBe(true);
      expect(result.output).toContain('[SUCCESS]');
      expect(result.output).toContain('Created .withcontextignore file');
      expect(vi.mocked(fs.writeFile)).toHaveBeenCalledWith(
        path.join(projectRoot, '.withcontextignore'),
        templateContent,
        'utf-8'
      );
    });

    it('should fail if .withcontextignore already exists', async () => {
      // Mock: file exists
      vi.mocked(fs.access).mockResolvedValueOnce(undefined);

      const result = await cli.createWithContextIgnore();

      expect(result.success).toBe(false);
      expect(result.error).toContain('[ERROR]');
      expect(result.error).toContain('already exists');
    });

    it('should use default content if template not found', async () => {
      // Mock: file doesn't exist
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));

      // Mock: template file doesn't exist
      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('ENOENT'));

      // Mock: writeFile succeeds
      vi.mocked(fs.writeFile).mockResolvedValueOnce(undefined);

      const result = await cli.createWithContextIgnore();

      expect(result.success).toBe(true);
      expect(vi.mocked(fs.writeFile)).toHaveBeenCalled();

      const writtenContent = vi.mocked(fs.writeFile).mock.calls[0][1] as string;
      expect(writtenContent).toContain('# .withcontextignore');
      expect(writtenContent).toContain('Syntax:');
    });

    it('should handle write errors gracefully', async () => {
      // Mock: file doesn't exist
      vi.mocked(fs.access).mockRejectedValueOnce(new Error('ENOENT'));

      // Mock: template file exists
      vi.mocked(fs.readFile).mockResolvedValueOnce('# Template\n');

      // Mock: writeFile fails
      vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Permission denied'));

      const result = await cli.createWithContextIgnore();

      expect(result.success).toBe(false);
      expect(result.error).toContain('[ERROR]');
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('checkDelegation', () => {
    beforeEach(() => {
      // Mock ignore file loading
      vi.mocked(fs.readFile).mockResolvedValue('docs/\n*.md\n!README.md\n');
    });

    it('should check if a file will be delegated', async () => {
      const result = await cli.checkDelegation('docs/guide.md');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Delegation Check');
      expect(result.output).toContain('docs/guide.md');
      expect(result.output).toContain('Will be delegated');
    });

    it('should handle absolute paths', async () => {
      const absolutePath = path.join(projectRoot, 'docs/guide.md');
      const result = await cli.checkDelegation(absolutePath);

      expect(result.success).toBe(true);
      expect(result.output).toContain('docs/guide.md');
    });

    it('should identify non-documentation files', async () => {
      const result = await cli.checkDelegation('src/index.ts');

      expect(result.success).toBe(true);
      expect(result.output).toContain('Is documentation file: No');
      expect(result.output).toContain('Will be delegated: No');
    });

    it('should handle negation patterns', async () => {
      const result = await cli.checkDelegation('README.md');

      expect(result.success).toBe(true);
      // README.md matches *.md but is negated by !README.md
      expect(result.output).toContain('README.md');
    });

    it('should handle errors gracefully', async () => {
      // Mock readFile to reject with ENOENT first (for access check), then fail for real read
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Read error'));

      const result = await cli.checkDelegation('docs/guide.md');

      // The code handles missing .withcontextignore gracefully by using empty patterns
      // So it should succeed, just with no patterns matched
      expect(result.success).toBe(true);
      expect(result.output).toContain('docs/guide.md');
    });
  });

  describe('delegationReport', () => {
    beforeEach(() => {
      // Mock ignore file loading
      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (typeof filePath === 'string' && filePath.endsWith('.withcontextignore')) {
          return 'docs/\n*.md\n!README.md\n';
        }
        throw new Error('File not found');
      });

      // Mock directory listing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readdir).mockImplementation(async (dirPath: any): Promise<any> => {
        const pathStr = typeof dirPath === 'string' ? dirPath : dirPath.toString();

        if (pathStr === projectRoot) {
          return [
            { name: 'README.md', isDirectory: () => false, isFile: () => true },
            { name: 'docs', isDirectory: () => true, isFile: () => false },
            { name: 'src', isDirectory: () => true, isFile: () => false },
          ] as unknown as Dirent[];
        }

        if (pathStr === path.join(projectRoot, 'docs')) {
          return [
            { name: 'guide.md', isDirectory: () => false, isFile: () => true },
            { name: 'api.md', isDirectory: () => false, isFile: () => true },
          ] as unknown as Dirent[];
        }

        if (pathStr === path.join(projectRoot, 'src')) {
          return [
            { name: 'index.ts', isDirectory: () => false, isFile: () => true },
          ] as unknown as Dirent[];
        }

        return [];
      });
    });

    it('should generate delegation report', async () => {
      const result = await cli.delegationReport();

      expect(result.success).toBe(true);
      expect(result.output).toContain('Delegation Report');
      expect(result.output).toContain('Total doc files found');
      expect(result.output).toContain('Files to be delegated');
      expect(result.output).toContain('Files kept local');
    });

    it('should show ignore patterns', async () => {
      const result = await cli.delegationReport();

      expect(result.success).toBe(true);
      expect(result.output).toContain('Ignore Patterns');
      expect(result.output).toContain('docs/');
      expect(result.output).toContain('*.md');
    });

    it('should show negation patterns', async () => {
      const result = await cli.delegationReport();

      expect(result.success).toBe(true);
      expect(result.output).toContain('Include Patterns');
      expect(result.output).toContain('!README.md');
    });

    it('should categorize files correctly', async () => {
      const result = await cli.delegationReport();

      expect(result.success).toBe(true);
      expect(result.output).toContain('Files to be Delegated');
      expect(result.output).toContain('Files Kept Local');
    });

    it('should warn if no .withcontextignore file exists', async () => {
      // Mock: ignore file doesn't exist
      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        if (typeof filePath === 'string' && filePath.endsWith('.withcontextignore')) {
          const error = new Error('ENOENT') as NodeJS.ErrnoException;
          error.code = 'ENOENT';
          throw error;
        }
        throw new Error('File not found');
      });

      const result = await cli.delegationReport();

      expect(result.success).toBe(true);
      expect(result.output).toContain('[WARNING]');
      expect(result.output).toContain('No .withcontextignore file found');
    });

    it('should limit displayed files to 20', async () => {
      // Mock many files
      const manyFiles: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }> =
        [];
      for (let i = 0; i < 30; i++) {
        manyFiles.push({
          name: `file${i}.md`,
          isDirectory: () => false,
          isFile: () => true,
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(fs.readdir).mockResolvedValue(manyFiles as any);

      const result = await cli.delegationReport();

      expect(result.success).toBe(true);
      expect(result.output).toContain('... and 10 more');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Permission denied'));

      const result = await cli.delegationReport();

      // The code handles permission errors gracefully by continuing with empty results
      // So it should succeed with no files found
      expect(result.success).toBe(true);
      expect(result.output).toContain('Delegation Report');
    });
  });

  describe('cacheStats', () => {
    it('should display cache statistics', async () => {
      const cache = new VaultCache(60000, 100);

      // Add some test data
      cache.set('file1.md', 'content1');
      cache.set('file2.md', 'content2');
      cache.get('file1.md');
      cache.get('file1.md');
      cache.get('file2.md');

      const result = await cli.cacheStats(cache);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Cache Statistics');
      expect(result.output).toContain('Total entries');
      expect(result.output).toContain('Valid entries');
      expect(result.output).toContain('Total hits');
      expect(result.output).toContain('Hit rate');
    });

    it('should show empty cache message', async () => {
      const cache = new VaultCache();

      const result = await cli.cacheStats(cache);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Cache is empty');
    });

    it('should fail if cache is not enabled', async () => {
      const result = await cli.cacheStats();

      expect(result.success).toBe(false);
      expect(result.error).toContain('[ERROR]');
      expect(result.error).toContain('Cache is not enabled');
    });

    it('should display TTL configuration', async () => {
      const cache = new VaultCache(120000); // 2 minutes

      const result = await cli.cacheStats(cache);

      expect(result.success).toBe(true);
      expect(result.output).toContain('TTL: 120s');
    });

    it('should handle errors gracefully', async () => {
      const cache = new VaultCache();

      // Mock getExtendedStats to throw error
      vi.spyOn(cache, 'getExtendedStats').mockImplementationOnce(() => {
        throw new Error('Cache error');
      });

      const result = await cli.cacheStats(cache);

      expect(result.success).toBe(false);
      expect(result.error).toContain('[ERROR]');
      expect(result.error).toContain('Cache error');
    });
  });

  describe('cacheClear', () => {
    it('should clear cache', async () => {
      const cache = new VaultCache();

      // Add some test data
      cache.set('file1.md', 'content1');
      cache.set('file2.md', 'content2');

      expect(cache.size()).toBe(2);

      const result = await cli.cacheClear(cache);

      expect(result.success).toBe(true);
      expect(result.output).toContain('[SUCCESS]');
      expect(result.output).toContain('Cache cleared');
      expect(result.output).toContain('Entries removed: 2');
      expect(cache.size()).toBe(0);
    });

    it('should handle empty cache', async () => {
      const cache = new VaultCache();

      const result = await cli.cacheClear(cache);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Entries removed: 0');
    });

    it('should fail if cache is not enabled', async () => {
      const result = await cli.cacheClear();

      expect(result.success).toBe(false);
      expect(result.error).toContain('[ERROR]');
      expect(result.error).toContain('Cache is not enabled');
    });

    it('should handle errors gracefully', async () => {
      const cache = new VaultCache();

      // Mock clear to throw error
      vi.spyOn(cache, 'clear').mockImplementationOnce(() => {
        throw new Error('Clear failed');
      });

      const result = await cli.cacheClear(cache);

      expect(result.success).toBe(false);
      expect(result.error).toContain('[ERROR]');
      expect(result.error).toContain('Clear failed');
    });
  });

  describe('executeCommand', () => {
    beforeEach(() => {
      vi.mocked(fs.readFile).mockResolvedValue('# Template\n');
      vi.mocked(fs.access).mockRejectedValue(new Error('ENOENT'));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);
      vi.mocked(fs.readdir).mockResolvedValue([]);
    });

    it('should execute create-withcontextignore command', async () => {
      const result = await executeCommand('create-withcontextignore', projectRoot);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Created .withcontextignore');
    });

    it('should execute check-delegation command', async () => {
      const result = await executeCommand('check-delegation', projectRoot, {
        filePath: 'docs/guide.md',
      });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Delegation Check');
    });

    it('should fail check-delegation without file path', async () => {
      const result = await executeCommand('check-delegation', projectRoot);

      expect(result.success).toBe(false);
      expect(result.error).toContain('requires a file path argument');
    });

    it('should execute delegation-report command', async () => {
      const result = await executeCommand('delegation-report', projectRoot);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Delegation Report');
    });

    it('should execute cache-stats command', async () => {
      const cache = new VaultCache();
      const result = await executeCommand('cache-stats', projectRoot, { cache });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Cache Statistics');
    });

    it('should execute cache-clear command', async () => {
      const cache = new VaultCache();
      const result = await executeCommand('cache-clear', projectRoot, { cache });

      expect(result.success).toBe(true);
      expect(result.output).toContain('Cache cleared');
    });

    it('should handle unknown command', async () => {
      const result = await executeCommand('unknown-command', projectRoot);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown command');
    });
  });

  describe('Output Formatting', () => {
    it('should use ASCII-only characters', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('docs/\n');

      vi.mocked(fs.readdir).mockResolvedValue([
        { name: 'test.md', isDirectory: () => false, isFile: () => true },
      ] as any);

      const result = await cli.delegationReport();

      // Check that output doesn't contain unicode box drawing characters
      expect(result.output).not.toMatch(/[│┤├─┬┴]/);

      // Check that output uses ASCII characters for formatting
      expect(result.output).toMatch(/[=\-*]/);
    });

    it('should format headers correctly', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('docs/\n');
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const result = await cli.delegationReport();

      expect(result.output).toContain('==='); // Header separator
      expect(result.output).toContain('---'); // Subheader separator
    });

    it('should format list items correctly', async () => {
      // Reset the CLI instance to pick up new mocks
      IgnoreConfig.resetInstance();
      cli = new DelegationCLI(projectRoot);

      // Mock file access - file exists
      vi.mocked(fs.access).mockResolvedValue(undefined);

      // Mock ignore file with patterns
      vi.mocked(fs.readFile).mockResolvedValue('docs/\n*.md\n');

      // Mock readdir to return empty (no actual files)
      vi.mocked(fs.readdir).mockResolvedValue([]);

      const result = await cli.delegationReport();

      // Check that patterns are formatted as list items
      expect(result.output).toMatch(/\* docs\//); // List item format
      expect(result.output).toMatch(/\* \*\.md/);
    });

    it('should format key-value pairs correctly', async () => {
      const cache = new VaultCache();
      const result = await cli.cacheStats(cache);

      expect(result.output).toMatch(/Total entries: \d+/);
      expect(result.output).toMatch(/Valid entries: \d+/);
    });
  });
});
