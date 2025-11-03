/**
 * Integration tests for unified delegation features
 * Tests the complete flow from write delegation to read interception
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { IgnoreConfig } from '../../src/doc-delegator/ignore-config.js';
import { IgnorePatternMatcher } from '../../src/doc-delegator/ignore-pattern-matcher.js';
import { ReadInterceptor } from '../../src/doc-delegator/read-interceptor.js';
import { VaultCache } from '../../src/doc-delegator/vault-cache.js';

describe('Unified Delegation E2E Tests', () => {
  let testDir;
  let ignoreConfig;
  let obsidianClient;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'with-context-test-'));

    // Create test project structure
    await fs.mkdir(path.join(testDir, 'docs'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'docs', 'internal'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });

    // Create test files
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project\n');
    await fs.writeFile(path.join(testDir, 'docs', 'guide.md'), '# User Guide\n');
    await fs.writeFile(path.join(testDir, 'docs', 'api.md'), '# API Reference\n');
    await fs.writeFile(path.join(testDir, 'docs', 'internal', 'notes.md'), '# Internal Notes\n');
    await fs.writeFile(path.join(testDir, 'src', 'index.ts'), 'export {};\n');

    // Reset singleton
    IgnoreConfig.resetInstance();

    // Mock Obsidian client
    obsidianClient = {
      readNote: async (vaultPath) => {
        // Simulate vault reads
        if (vaultPath.includes('guide.md')) {
          return '# User Guide from Vault\n';
        }
        if (vaultPath.includes('api.md')) {
          return '# API Reference from Vault\n';
        }
        return null;
      },
      writeNote: async () => {
        // Mock write - just return success
        return true;
      },
    };
  });

  afterEach(async () => {
    // Clean up temp directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Reset singleton
    IgnoreConfig.resetInstance();
  });

  describe('E2E: Write with Ignore Patterns', () => {
    it('should delegate files matching ignore patterns', async () => {
      // Create .withcontextignore
      const ignoreContent = `
# Delegate docs directory
docs/
!docs/internal/
`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);

      // Load ignore config
      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();

      const matcher = await ignoreConfig.getMatcher();

      // Check delegation decisions
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('docs/api.md')).toBe(true);
      expect(matcher.isIgnored('docs/internal/notes.md')).toBe(false); // Negated
      expect(matcher.isIgnored('README.md')).toBe(false);
      expect(matcher.isIgnored('src/index.ts')).toBe(false);
    });

    it('should handle complex patterns', async () => {
      const ignoreContent = `
# Multiple patterns
*.md
!README.md
**/internal/**
/docs/
`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();

      const matcher = await ignoreConfig.getMatcher();

      expect(matcher.isIgnored('README.md')).toBe(false); // Negated
      expect(matcher.isIgnored('docs/guide.md')).toBe(true); // Matches both *.md and /docs/
      expect(matcher.isIgnored('docs/internal/notes.md')).toBe(true); // Matches **/internal/**
    });

    it('should handle empty ignore file', async () => {
      // Create empty .withcontextignore
      await fs.writeFile(path.join(testDir, '.withcontextignore'), '# Empty file\n');

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();

      const matcher = await ignoreConfig.getMatcher();

      // Nothing should be ignored
      expect(matcher.isIgnored('docs/guide.md')).toBe(false);
      expect(matcher.isIgnored('README.md')).toBe(false);
    });

    it('should work without ignore file (backward compatible)', async () => {
      // No .withcontextignore file
      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();

      const matcher = await ignoreConfig.getMatcher();

      // Nothing should be ignored
      expect(matcher.isIgnored('docs/guide.md')).toBe(false);
      expect(matcher.isIgnored('README.md')).toBe(false);
      expect(ignoreConfig.hasIgnoreFile()).toBe(false);
    });
  });

  describe('E2E: Read from Vault with Caching', () => {
    beforeEach(async () => {
      // Create .withcontextignore for these tests
      const ignoreContent = `docs/\n`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();
    });

    it('should read from vault with local-first strategy', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'local-first',
        projectBasePath: 'Projects',
      });

      // File exists locally, should read from local
      const guidePath = path.join(testDir, 'docs', 'guide.md');
      const result = await interceptor.interceptRead(guidePath, testDir);

      expect(result).toBeTruthy();
      expect(result).toContain('# User Guide'); // From local file
      expect(result).toContain('00001|'); // Should have line numbers
    });

    it('should read from vault with vault-first strategy', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-first',
        projectBasePath: 'Projects',
      });

      // File exists locally, but should read from vault first
      const guidePath = path.join(testDir, 'docs', 'guide.md');
      const result = await interceptor.interceptRead(guidePath, testDir);

      expect(result).toBeTruthy();
      expect(result).toContain('from Vault'); // From vault
      expect(result).toContain('00001|'); // Should have line numbers
    });

    it('should read from vault with vault-only strategy', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
        projectBasePath: 'Projects',
      });

      // Should only read from vault
      const guidePath = path.join(testDir, 'docs', 'guide.md');
      const result = await interceptor.interceptRead(guidePath, testDir);

      expect(result).toBeTruthy();
      expect(result).toContain('from Vault'); // From vault only
    });

    it('should cache vault reads', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
        projectBasePath: 'Projects',
      });

      const guidePath = path.join(testDir, 'docs', 'guide.md');

      // First read - should hit vault
      const result1 = await interceptor.interceptRead(guidePath, testDir);
      expect(result1).toBeTruthy();

      const statsAfterFirstRead = cache.getStats();
      expect(statsAfterFirstRead.size).toBe(1);

      // Second read - should hit cache
      const result2 = await interceptor.interceptRead(guidePath, testDir);
      expect(result2).toBeTruthy();
      expect(result2).toBe(result1);

      const statsAfterSecondRead = cache.getExtendedStats();
      expect(statsAfterSecondRead.totalHits).toBeGreaterThan(0);
    });

    it('should not intercept non-delegated files', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
        projectBasePath: 'Projects',
      });

      // README.md is not in docs/, so shouldn't be delegated
      const readmePath = path.join(testDir, 'README.md');
      const result = await interceptor.interceptRead(readmePath, testDir);

      expect(result).toBeNull(); // Should return null (use normal read)
    });

    it('should not intercept non-doc files', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
        projectBasePath: 'Projects',
      });

      // TypeScript files shouldn't be delegated
      const tsPath = path.join(testDir, 'src', 'index.ts');
      const result = await interceptor.interceptRead(tsPath, testDir);

      expect(result).toBeNull(); // Should return null (use normal read)
    });
  });

  describe('E2E: Ignore Pattern Changes', () => {
    it('should reload patterns when ignore file changes', async () => {
      // Initial ignore file
      await fs.writeFile(path.join(testDir, '.withcontextignore'), 'docs/guide.md\n');

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();

      let matcher = await ignoreConfig.getMatcher();
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('docs/api.md')).toBe(false);

      // Update ignore file
      await fs.writeFile(path.join(testDir, '.withcontextignore'), 'docs/\n');

      // Reload patterns
      await ignoreConfig.reload();

      matcher = await ignoreConfig.getMatcher();
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('docs/api.md')).toBe(true);
    });

    it('should handle pattern syntax changes', async () => {
      // Start with root-only pattern
      await fs.writeFile(path.join(testDir, '.withcontextignore'), '/docs/\n');

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();

      let matcher = await ignoreConfig.getMatcher();
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);

      // Change to wildcard pattern
      await fs.writeFile(path.join(testDir, '.withcontextignore'), '**/docs/**\n');

      await ignoreConfig.reload();

      matcher = await ignoreConfig.getMatcher();
      expect(matcher.isIgnored('docs/guide.md')).toBe(true);
      expect(matcher.isIgnored('nested/docs/file.md')).toBe(true);
    });
  });

  describe('E2E: All Read Strategies', () => {
    beforeEach(async () => {
      const ignoreContent = `docs/\n`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();
    });

    it('should fallback from local to vault in local-first', async () => {
      // Create mock client that returns vault content
      const mockClient = {
        readNote: async () => '# From Vault\n',
      };

      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: mockClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'local-first',
      });

      // Try to read non-existent file
      const nonExistentPath = path.join(testDir, 'docs', 'nonexistent.md');
      const result = await interceptor.interceptRead(nonExistentPath, testDir);

      expect(result).toBeTruthy();
      expect(result).toContain('From Vault');
    });

    it('should fallback from vault to local in vault-first', async () => {
      // Create mock client that returns null (file not in vault)
      const mockClient = {
        readNote: async () => null,
      };

      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: mockClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-first',
      });

      // Try to read file that exists locally but not in vault
      const guidePath = path.join(testDir, 'docs', 'guide.md');
      const result = await interceptor.interceptRead(guidePath, testDir);

      expect(result).toBeTruthy();
      expect(result).toContain('# User Guide'); // From local
    });

    it('should throw error in vault-only if file not found', async () => {
      // Create mock client that returns null
      const mockClient = {
        readNote: async () => null,
      };

      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: mockClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      const nonExistentPath = path.join(testDir, 'docs', 'nonexistent.md');

      await expect(interceptor.interceptRead(nonExistentPath, testDir)).rejects.toThrow(
        'File not found in vault'
      );
    });
  });

  describe('E2E: Cache Expiration', () => {
    it('should expire cache entries after TTL', async () => {
      // Create cache with 100ms TTL
      const cache = new VaultCache(100, 1000);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      const ignoreContent = `docs/\n`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);
      await ignoreConfig.loadIgnoreFile();

      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      const guidePath = path.join(testDir, 'docs', 'guide.md');

      // First read
      await interceptor.interceptRead(guidePath, testDir);

      expect(cache.size()).toBe(1);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Try to get from cache - should be expired
      const vaultPath = 'Projects/' + path.basename(testDir) + '/docs/guide.md';
      const cached = cache.get(vaultPath);

      expect(cached).toBeNull(); // Should be expired
    });

    it('should handle LRU eviction', async () => {
      // Create cache with max 2 entries
      const cache = new VaultCache(60000, 2);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      const ignoreContent = `docs/\n`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);
      await ignoreConfig.loadIgnoreFile();

      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      // Read 3 files
      await interceptor.interceptRead(path.join(testDir, 'docs', 'guide.md'), testDir);
      await interceptor.interceptRead(path.join(testDir, 'docs', 'api.md'), testDir);

      expect(cache.size()).toBe(2);

      // Read third file - should evict oldest
      await fs.writeFile(path.join(testDir, 'docs', 'third.md'), '# Third\n');

      const mockClient = {
        readNote: async () => '# Third from Vault\n',
      };

      const interceptor2 = new ReadInterceptor({
        client: mockClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      await interceptor2.interceptRead(path.join(testDir, 'docs', 'third.md'), testDir);

      expect(cache.size()).toBe(2); // Should still be 2 (LRU eviction)

      const stats = cache.getExtendedStats();
      expect(stats.totalEvictions).toBe(1);
    });
  });

  describe('E2E: Performance Benchmarks', () => {
    beforeEach(async () => {
      const ignoreContent = `docs/\n`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();
    });

    it('should cache reads for performance', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      const guidePath = path.join(testDir, 'docs', 'guide.md');

      // Measure first read (cold cache)
      const start1 = Date.now();
      await interceptor.interceptRead(guidePath, testDir);
      const duration1 = Date.now() - start1;

      // Measure second read (warm cache)
      const start2 = Date.now();
      await interceptor.interceptRead(guidePath, testDir);
      const duration2 = Date.now() - start2;

      // Cached read should be faster
      expect(duration2).toBeLessThanOrEqual(duration1);

      // Check cache hit
      const stats = cache.getExtendedStats();
      expect(stats.totalHits).toBeGreaterThan(0);
    });

    it('should handle multiple concurrent reads efficiently', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      const guidePath = path.join(testDir, 'docs', 'guide.md');
      const apiPath = path.join(testDir, 'docs', 'api.md');

      // Perform multiple concurrent reads
      const start = Date.now();
      const results = await Promise.all([
        interceptor.interceptRead(guidePath, testDir),
        interceptor.interceptRead(apiPath, testDir),
        interceptor.interceptRead(guidePath, testDir), // Duplicate
        interceptor.interceptRead(apiPath, testDir), // Duplicate
      ]);
      const duration = Date.now() - start;

      // All reads should succeed
      expect(results.every((r) => r !== null)).toBe(true);

      // Should complete reasonably fast
      expect(duration).toBeLessThan(1000);

      // Check cache contains entries
      expect(cache.size()).toBeGreaterThan(0);
    });

    it('should handle pattern matching efficiently', async () => {
      const matcher = new IgnorePatternMatcher();

      // Add many patterns
      const patterns = [];
      for (let i = 0; i < 100; i++) {
        patterns.push(`pattern${i}/`);
      }
      matcher.parsePatterns(patterns.join('\n'));

      // Measure pattern matching
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        matcher.isIgnored('docs/guide.md');
        matcher.isIgnored(`pattern${i % 100}/file.md`);
      }
      const duration = Date.now() - start;

      // Should complete reasonably fast (allow 2000ms for CI environments)
      expect(duration).toBeLessThan(2000); // 2000ms for 2000 checks (allows for slower CI)
    });
  });

  describe('E2E: Delegation Decision Flow', () => {
    beforeEach(async () => {
      const ignoreContent = `
# Delegate docs
docs/
!docs/internal/

# Delegate markdown
*.md
!README.md
`;
      await fs.writeFile(path.join(testDir, '.withcontextignore'), ignoreContent);

      ignoreConfig = IgnoreConfig.getInstance(testDir);
      await ignoreConfig.loadIgnoreFile();
    });

    it('should make correct delegation decisions', async () => {
      const cache = new VaultCache();
      const interceptor = new ReadInterceptor({
        client: obsidianClient,
        ignoreConfig,
        vaultCache: cache,
        strategy: 'vault-only',
      });

      // Test various files
      const testCases = [
        { file: 'docs/guide.md', shouldDelegate: true, reason: 'In docs/ and is .md' },
        { file: 'docs/internal/notes.md', shouldDelegate: false, reason: 'Negated pattern' },
        { file: 'README.md', shouldDelegate: false, reason: 'Negated pattern' },
        { file: 'other.md', shouldDelegate: true, reason: 'Matches *.md' },
        { file: 'src/index.ts', shouldDelegate: false, reason: 'Not a doc file' },
      ];

      for (const testCase of testCases) {
        const filePath = path.join(testDir, testCase.file);
        const decision = await interceptor.makeDecision(filePath, testDir);

        expect(decision.shouldDelegate).toBe(testCase.shouldDelegate);
      }
    });
  });
});
