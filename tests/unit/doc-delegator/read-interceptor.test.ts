/**
 * Tests for ReadInterceptor
 * Tests all 3 strategies, local/vault fallback, ignore patterns
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { ReadInterceptor } from '../../../src/doc-delegator/read-interceptor.js';
import { IgnoreConfig } from '../../../src/doc-delegator/ignore-config.js';
import { VaultCache } from '../../../src/doc-delegator/vault-cache.js';
import type { ObsidianClient } from '../../../src/obsidian/client.js';

// Mock ObsidianClient
vi.mock('../../../src/obsidian/client.js');

describe('ReadInterceptor', () => {
  let interceptor: ReadInterceptor;
  let mockClient: {
    readNote: ReturnType<typeof vi.fn>;
    getVaultName: ReturnType<typeof vi.fn>;
  };
  let ignoreConfig: IgnoreConfig;
  let vaultCache: VaultCache;
  let projectRoot: string;

  beforeEach(() => {
    // Setup mocks
    mockClient = {
      readNote: vi.fn(),
      getVaultName: vi.fn(() => 'test-vault'),
    };

    // Setup project root
    projectRoot = '/Users/test/Projects/test-project';

    // Setup ignore config
    IgnoreConfig.resetInstance();
    ignoreConfig = IgnoreConfig.getInstance(projectRoot);

    // Setup cache
    vaultCache = new VaultCache(5000, 10);

    // Create interceptor with local-first strategy
    interceptor = new ReadInterceptor({
      client: mockClient as unknown as ObsidianClient,
      ignoreConfig,
      vaultCache,
      strategy: 'local-first',
      projectBasePath: 'Projects',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    IgnoreConfig.resetInstance();
  });

  describe('Documentation file detection', () => {
    it('should detect .md files', async () => {
      const filePath = path.join(projectRoot, 'README.md');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.isDocFile).toBe(true);
    });

    it('should detect .txt files', async () => {
      const filePath = path.join(projectRoot, 'notes.txt');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.isDocFile).toBe(true);
    });

    it('should detect special doc files (README, CHANGELOG)', async () => {
      const readmePath = path.join(projectRoot, 'README.md');
      const changelogPath = path.join(projectRoot, 'CHANGELOG.md');

      const readmeDecision = await interceptor.makeDecision(readmePath, projectRoot);
      const changelogDecision = await interceptor.makeDecision(changelogPath, projectRoot);

      expect(readmeDecision.isDocFile).toBe(true);
      expect(changelogDecision.isDocFile).toBe(true);
    });

    it('should detect files in docs/ directory', async () => {
      const filePath = path.join(projectRoot, 'docs', 'guide.md');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.isDocFile).toBe(true);
    });

    it('should reject non-doc files', async () => {
      const filePath = path.join(projectRoot, 'src', 'index.ts');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.isDocFile).toBe(false);
      expect(decision.shouldDelegate).toBe(false);
    });
  });

  describe('Ignore pattern integration', () => {
    beforeEach(async () => {
      // Setup ignore patterns
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**\nREADME.md');
    });

    it('should delegate files matching ignore patterns', async () => {
      const filePath = path.join(projectRoot, 'README.md');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.shouldDelegate).toBe(true);
      expect(decision.matchesIgnorePattern).toBe(true);
      expect(decision.reason).toBe('Matches ignore patterns');
    });

    it('should not delegate files not matching ignore patterns', async () => {
      const filePath = path.join(projectRoot, 'CONTRIBUTING.md');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.shouldDelegate).toBe(false);
      expect(decision.matchesIgnorePattern).toBe(false);
    });

    it('should delegate files in docs/ directory', async () => {
      const filePath = path.join(projectRoot, 'docs', 'guide.md');
      const decision = await interceptor.makeDecision(filePath, projectRoot);

      expect(decision.shouldDelegate).toBe(true);
      expect(decision.matchesIgnorePattern).toBe(true);
    });
  });

  describe('local-first strategy', () => {
    beforeEach(async () => {
      // Setup ignore patterns to delegate docs
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      // Set strategy
      interceptor.setStrategy('local-first');
    });

    it('should read from local file if exists', async () => {
      const filePath = path.join(projectRoot, 'docs', 'local.md');
      const localContent = '# Local File\nThis is local content';

      // Mock fs.access (file exists)
      vi.spyOn(fs, 'access').mockResolvedValue(undefined);

      // Mock fs.readFile
      vi.spyOn(fs, 'readFile').mockResolvedValue(localContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).not.toBeNull();
      expect(result).toContain('00001| # Local File');
      expect(result).toContain('00002| This is local content');
      expect(mockClient.readNote).not.toHaveBeenCalled();
    });

    it('should fallback to vault if local file not found', async () => {
      const filePath = path.join(projectRoot, 'docs', 'vault.md');
      const vaultContent = '# Vault File\nThis is vault content';

      // Mock fs.access (file doesn't exist)
      vi.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'));

      // Mock vault read
      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).not.toBeNull();
      expect(result).toContain('00001| # Vault File');
      expect(result).toContain('00002| This is vault content');
      expect(mockClient.readNote).toHaveBeenCalledWith('Projects/test-project/docs/vault.md');
    });

    it('should fallback to vault if local file read fails', async () => {
      const filePath = path.join(projectRoot, 'docs', 'error.md');
      const vaultContent = '# Vault File';

      // Mock fs.access (file exists)
      vi.spyOn(fs, 'access').mockResolvedValue(undefined);

      // Mock fs.readFile (read fails)
      vi.spyOn(fs, 'readFile').mockRejectedValue(new Error('Permission denied'));

      // Mock vault read
      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).not.toBeNull();
      expect(mockClient.readNote).toHaveBeenCalled();
    });

    it('should return null if both local and vault fail', async () => {
      const filePath = path.join(projectRoot, 'docs', 'missing.md');

      // Mock fs.access (file doesn't exist)
      vi.spyOn(fs, 'access').mockRejectedValue(new Error('ENOENT'));

      // Mock vault read (not found)
      mockClient.readNote.mockRejectedValue(new Error('Not found'));

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).toBeNull();
    });
  });

  describe('vault-first strategy', () => {
    beforeEach(async () => {
      // Setup ignore patterns
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      // Set strategy
      interceptor.setStrategy('vault-first');
    });

    it('should read from vault first', async () => {
      const filePath = path.join(projectRoot, 'docs', 'vault.md');
      const vaultContent = '# Vault File';

      // Mock vault read
      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).not.toBeNull();
      expect(result).toContain('00001| # Vault File');
      expect(mockClient.readNote).toHaveBeenCalledWith('Projects/test-project/docs/vault.md');
    });

    it('should fallback to local if vault fails', async () => {
      const filePath = path.join(projectRoot, 'docs', 'local.md');
      const localContent = '# Local File';

      // Mock vault read (fails)
      mockClient.readNote.mockRejectedValue(new Error('Not found'));

      // Mock fs.access (file exists)
      vi.spyOn(fs, 'access').mockResolvedValue(undefined);

      // Mock fs.readFile
      vi.spyOn(fs, 'readFile').mockResolvedValue(localContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).not.toBeNull();
      expect(result).toContain('00001| # Local File');
      expect(mockClient.readNote).toHaveBeenCalled();
      expect(fs.readFile).toHaveBeenCalled();
    });
  });

  describe('vault-only strategy', () => {
    beforeEach(async () => {
      // Setup ignore patterns
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      // Set strategy
      interceptor.setStrategy('vault-only');
    });

    it('should read only from vault', async () => {
      const filePath = path.join(projectRoot, 'docs', 'vault.md');
      const vaultContent = '# Vault Only';

      // Mock vault read
      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).not.toBeNull();
      expect(result).toContain('00001| # Vault Only');
      expect(mockClient.readNote).toHaveBeenCalled();
    });

    it('should throw error if vault fails', async () => {
      const filePath = path.join(projectRoot, 'docs', 'missing.md');

      // Mock vault read (fails)
      mockClient.readNote.mockRejectedValue(new Error('Not found'));

      await expect(interceptor.interceptRead(filePath, projectRoot)).rejects.toThrow(
        'File not found in vault'
      );
    });
  });

  describe('Caching', () => {
    beforeEach(async () => {
      // Setup ignore patterns
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      interceptor.setStrategy('vault-first');
    });

    it('should cache vault reads', async () => {
      const filePath = path.join(projectRoot, 'docs', 'cached.md');
      const vaultContent = '# Cached File';
      const vaultPath = 'Projects/test-project/docs/cached.md';

      // Mock vault read
      mockClient.readNote.mockResolvedValue(vaultContent);

      // First read - from vault
      await interceptor.interceptRead(filePath, projectRoot);
      expect(mockClient.readNote).toHaveBeenCalledTimes(1);

      // Second read - from cache
      await interceptor.interceptRead(filePath, projectRoot);
      expect(mockClient.readNote).toHaveBeenCalledTimes(1); // Still 1 (cached)

      // Verify cache
      expect(vaultCache.has(vaultPath)).toBe(true);
    });

    it('should return cache statistics', async () => {
      const filePath = path.join(projectRoot, 'docs', 'stats.md');
      mockClient.readNote.mockResolvedValue('# Stats');

      // Setup ignore patterns
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      await interceptor.interceptRead(filePath, projectRoot);
      await interceptor.interceptRead(filePath, projectRoot);

      const stats = interceptor.getCacheStats();
      expect(stats).not.toBeNull();
      expect(stats?.size).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      const filePath = path.join(projectRoot, 'docs', 'clear.md');
      mockClient.readNote.mockResolvedValue('# Clear');

      await interceptor.interceptRead(filePath, projectRoot);

      interceptor.clearCache();

      const stats = interceptor.getCacheStats();
      expect(stats?.size).toBe(0);
    });
  });

  describe('Line number formatting', () => {
    beforeEach(async () => {
      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');
      interceptor.setStrategy('vault-first');
    });

    it('should format content with line numbers', async () => {
      const filePath = path.join(projectRoot, 'docs', 'format.md');
      const vaultContent = '# Title\n\nParagraph 1\nParagraph 2';

      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).toBe('00001| # Title\n00002| \n00003| Paragraph 1\n00004| Paragraph 2');
    });

    it('should handle empty lines', async () => {
      const filePath = path.join(projectRoot, 'docs', 'empty.md');
      const vaultContent = 'Line 1\n\n\nLine 4';

      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).toContain('00001| Line 1');
      expect(result).toContain('00002| ');
      expect(result).toContain('00003| ');
      expect(result).toContain('00004| Line 4');
    });

    it('should handle single line', async () => {
      const filePath = path.join(projectRoot, 'docs', 'single.md');
      const vaultContent = 'Single line';

      mockClient.readNote.mockResolvedValue(vaultContent);

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).toBe('00001| Single line');
    });
  });

  describe('Vault path conversion', () => {
    it('should construct correct vault path', async () => {
      const filePath = path.join(projectRoot, 'docs', 'api', 'endpoints.md');
      const vaultContent = '# API';

      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      interceptor.setStrategy('vault-first');

      mockClient.readNote.mockResolvedValue(vaultContent);

      await interceptor.interceptRead(filePath, projectRoot);

      expect(mockClient.readNote).toHaveBeenCalledWith(
        'Projects/test-project/docs/api/endpoints.md'
      );
    });

    it('should handle Windows paths', async () => {
      // On Unix systems, we can't fully test Windows paths, but we can verify
      // that backslashes in relative paths are normalized to forward slashes
      const filePath = path.join(projectRoot, 'docs', 'api', 'guide.md');
      const vaultContent = '# Guide';

      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      interceptor.setStrategy('vault-first');

      mockClient.readNote.mockResolvedValue(vaultContent);

      await interceptor.interceptRead(filePath, projectRoot);

      // Verify that vault path uses forward slashes
      const calledWith = mockClient.readNote.mock.calls[0]?.[0];
      expect(calledWith).toBe('Projects/test-project/docs/api/guide.md');
      expect(calledWith).not.toContain('\\');
    });
  });

  describe('Strategy management', () => {
    it('should get current strategy', () => {
      expect(interceptor.getStrategy()).toBe('local-first');
    });

    it('should set strategy', () => {
      interceptor.setStrategy('vault-only');
      expect(interceptor.getStrategy()).toBe('vault-only');
    });

    it('should get cache instance', () => {
      const cache = interceptor.getCache();
      expect(cache).toBe(vaultCache);
    });
  });

  describe('Error handling', () => {
    it('should handle unknown strategy', async () => {
      const filePath = path.join(projectRoot, 'docs', 'error.md');

      const matcher = await ignoreConfig.getMatcher();
      matcher.parsePatterns('docs/**');

      // @ts-expect-error Testing invalid strategy
      interceptor.setStrategy('invalid-strategy');

      await expect(interceptor.interceptRead(filePath, projectRoot)).rejects.toThrow(
        'Unknown delegation strategy'
      );
    });

    it('should return null for non-delegated files', async () => {
      const filePath = path.join(projectRoot, 'src', 'index.ts');

      const result = await interceptor.interceptRead(filePath, projectRoot);

      expect(result).toBeNull();
      expect(mockClient.readNote).not.toHaveBeenCalled();
    });
  });
});
