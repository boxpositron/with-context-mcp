import { describe, it, expect } from 'vitest';
import {
  extractKeywords,
  categorizeFile,
  extractTopics,
} from '../../src/vault-organizer/vault-analyzer.js';
import type { VaultFileInfo } from '../../src/vault-organizer/types.js';

describe('vault-analyzer', () => {
  describe('extractKeywords', () => {
    it('should extract keywords from content', () => {
      const content = `
# Test Document

This is a test document about TypeScript programming.
TypeScript is a typed superset of JavaScript.
Programming with TypeScript provides better developer experience.
`;

      const keywords = extractKeywords(content);

      expect(keywords).toBeInstanceOf(Array);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain('typescript');
      expect(keywords).toContain('programming');
    });

    it('should filter out stop words', () => {
      const content = 'the quick brown fox jumps over the lazy dog';

      const keywords = extractKeywords(content);

      // Stop words like 'the' should be filtered
      expect(keywords).not.toContain('the');
      // Short words (3 or fewer chars) should also be filtered
      expect(keywords).not.toContain('fox');
      expect(keywords).not.toContain('dog');
    });

    it('should limit to 20 keywords', () => {
      const content = Array(100)
        .fill('unique')
        .map((word, i) => `${word}${i}`)
        .join(' ');

      const keywords = extractKeywords(content);

      expect(keywords.length).toBeLessThanOrEqual(20);
    });
  });

  describe('categorizeFile', () => {
    it('should categorize README as documentation', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/README.md',
        name: 'README.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        keywords: [],
        topics: [],
      };

      expect(categorizeFile(fileInfo)).toBe('documentation');
    });

    it('should categorize meeting files as meeting-notes', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/meetings/2024-01-15.md',
        name: '2024-01-15.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        keywords: [],
        topics: [],
      };

      expect(categorizeFile(fileInfo)).toBe('meeting-notes');
    });

    it('should categorize project plans', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/roadmap.md',
        name: 'roadmap.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        keywords: [],
        topics: [],
      };

      expect(categorizeFile(fileInfo)).toBe('project-plans');
    });

    it('should use frontmatter type if available', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/somefile.md',
        name: 'somefile.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        contentMetadata: {
          headings: [],
          frontmatter: { type: 'reference' },
          wordCount: 100,
          links: [],
          backlinks: [],
          codeBlocks: [],
          tags: [],
        },
        keywords: [],
        topics: [],
      };

      expect(categorizeFile(fileInfo)).toBe('reference');
    });

    it('should return uncategorized for unknown files', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/random.md',
        name: 'random.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        keywords: [],
        topics: [],
      };

      expect(categorizeFile(fileInfo)).toBe('uncategorized');
    });
  });

  describe('extractTopics', () => {
    it('should extract topics from tags', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/test.md',
        name: 'test.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        contentMetadata: {
          headings: [],
          frontmatter: {},
          wordCount: 100,
          links: [],
          backlinks: [],
          codeBlocks: [],
          tags: ['typescript', 'programming'],
        },
        keywords: [],
        topics: [],
      };

      const topics = extractTopics(fileInfo);

      expect(topics).toContain('typescript');
      expect(topics).toContain('programming');
    });

    it('should extract topics from keywords', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/test.md',
        name: 'test.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        keywords: ['react', 'frontend', 'development'],
        topics: [],
      };

      const topics = extractTopics(fileInfo);

      expect(topics.length).toBeGreaterThan(0);
      // Should include some keywords (limited to 5)
      expect(topics).toContain('react');
    });

    it('should extract topics from headings', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/test.md',
        name: 'test.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        contentMetadata: {
          headings: ['# Introduction', '## Getting Started'],
          frontmatter: {},
          wordCount: 100,
          links: [],
          backlinks: [],
          codeBlocks: [],
          tags: [],
        },
        keywords: [],
        topics: [],
      };

      const topics = extractTopics(fileInfo);

      expect(topics).toContain('introduction');
      expect(topics).toContain('getting started');
    });

    it('should limit topics to 10', () => {
      const fileInfo: VaultFileInfo = {
        path: 'projects/test/test.md',
        name: 'test.md',
        extension: 'md',
        size: 1024,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        contentMetadata: {
          headings: Array(20)
            .fill('# ')
            .map((h, i) => `${h}Heading ${i}`),
          frontmatter: {},
          wordCount: 100,
          links: [],
          backlinks: [],
          codeBlocks: [],
          tags: Array(20)
            .fill('tag')
            .map((t, i) => `${t}${i}`),
        },
        keywords: Array(20)
          .fill('keyword')
          .map((k, i) => `${k}${i}`),
        topics: [],
      };

      const topics = extractTopics(fileInfo);

      expect(topics.length).toBeLessThanOrEqual(10);
    });
  });
});
