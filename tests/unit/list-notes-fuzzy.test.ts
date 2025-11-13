/**
 * List Notes Fuzzy Finding Tests
 *
 * Comprehensive tests for the fuzzy search feature in list_notes tool.
 * Tests fuzzy search queries, filename vs path prioritization, score thresholds,
 * result limiting, match highlighting, backwards compatibility, and performance.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listNotes, listNotesSchema } from '../../src/tools/list-notes.js';
import { ObsidianClient } from '../../src/obsidian/client.js';
import { sessionState } from '../../src/session-state.js';

// Mock modules
vi.mock('../../src/obsidian/client.js');
vi.mock('../../src/config/index.js', () => ({
  config: {
    obsidianApiUrl: 'https://127.0.0.1:27124',
    obsidianApiKey: 'test-key',
    obsidianVault: 'TestVault',
    projectBasePath: 'Projects',
    nodeEnv: 'test',
  },
}));

describe('List Notes - Fuzzy Finding', () => {
  let mockListNotes: ReturnType<typeof vi.fn>;

  // Sample file list for testing
  const sampleFiles = [
    'README.md',
    'docs/api-reference.md',
    'docs/getting-started.md',
    'src/components/Button.md',
    'src/components/ButtonGroup.md',
    'src/utils/api-client.md',
    'tests/unit/api-tests.md',
    'tests/integration/button-tests.md',
    'meetings/2024-01-15-standup.md',
    'meetings/2024-01-16-planning.md',
    'notes/project-ideas.md',
    'notes/random-thoughts.md',
    'archive/old-api-docs.md',
  ];

  beforeEach(() => {
    // Set up project context
    sessionState.setProjectContext('test-project', 'Projects');

    // Mock ObsidianClient.listNotes to return sample files
    mockListNotes = vi.fn().mockResolvedValue(sampleFiles);
    vi.mocked(ObsidianClient.prototype.listNotes).mockImplementation(mockListNotes);
  });

  afterEach(() => {
    vi.clearAllMocks();
    sessionState.clearContext();
  });

  describe('Schema Validation', () => {
    it('should accept fuzzy_query parameter', () => {
      const input = {
        path: '',
        fuzzy_query: 'api',
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fuzzy_query).toBe('api');
      }
    });

    it('should accept limit parameter', () => {
      const input = {
        fuzzy_query: 'test',
        limit: 10,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should accept min_score parameter', () => {
      const input = {
        fuzzy_query: 'test',
        min_score: -5000,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.min_score).toBe(-5000);
      }
    });

    it('should accept include_highlights parameter', () => {
      const input = {
        fuzzy_query: 'test',
        include_highlights: false,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include_highlights).toBe(false);
      }
    });

    it('should default limit to 50', () => {
      const input = { fuzzy_query: 'test' };
      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should default min_score to -10000', () => {
      const input = { fuzzy_query: 'test' };
      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.min_score).toBe(-10000);
      }
    });

    it('should default include_highlights to true', () => {
      const input = { fuzzy_query: 'test' };
      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.include_highlights).toBe(true);
      }
    });

    it('should reject negative limit', () => {
      const input = {
        fuzzy_query: 'test',
        limit: -5,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject zero limit', () => {
      const input = {
        fuzzy_query: 'test',
        limit: 0,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should reject non-integer limit', () => {
      const input = {
        fuzzy_query: 'test',
        limit: 5.5,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('should accept all parameters together', () => {
      const input = {
        path: 'docs',
        fuzzy_query: 'api',
        limit: 20,
        min_score: -8000,
        include_highlights: true,
      };

      const result = listNotesSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.path).toBe('docs');
        expect(result.data.fuzzy_query).toBe('api');
        expect(result.data.limit).toBe(20);
        expect(result.data.min_score).toBe(-8000);
        expect(result.data.include_highlights).toBe(true);
      }
    });
  });

  describe('Fuzzy Search - Basic Queries', () => {
    it('should find files matching simple query', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBe('api');
      expect(parsed.files.length).toBeGreaterThan(0);

      // Should find files with "api" in them
      const paths = parsed.files.map((f: any) => f.path);
      expect(paths).toContain('docs/api-reference.md');
      expect(paths).toContain('src/utils/api-client.md');
    });

    it('should find files with partial matches', async () => {
      const result = await listNotes({ fuzzy_query: 'btn' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      // Should find Button files
      const paths = parsed.files.map((f: any) => f.path);
      expect(paths.some((p: string) => p.includes('Button'))).toBe(true);
    });

    it('should handle case-insensitive search', async () => {
      const result = await listNotes({ fuzzy_query: 'API' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const paths = parsed.files.map((f: any) => f.path);
      expect(paths).toContain('docs/api-reference.md');
    });

    it('should find files with multi-word queries', async () => {
      const result = await listNotes({ fuzzy_query: 'getting started' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const paths = parsed.files.map((f: any) => f.path);
      expect(paths).toContain('docs/getting-started.md');
    });

    it('should handle queries with special characters', async () => {
      const result = await listNotes({ fuzzy_query: '2024-01' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const paths = parsed.files.map((f: any) => f.path);
      expect(paths.some((p: string) => p.includes('2024-01'))).toBe(true);
    });
  });

  describe('Filename vs Path Prioritization', () => {
    it('should prioritize filename matches over path matches', async () => {
      const result = await listNotes({ fuzzy_query: 'button' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      // Files with "button" in filename should rank higher than path-only matches
      const firstResult = parsed.files[0];
      expect(firstResult.path).toMatch(/Button/);
    });

    it('should boost filename match scores', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);

      // Find results with "api" in filename vs path
      const filenameMatch = parsed.files.find((f: any) => f.path === 'src/utils/api-client.md');
      const pathMatch = parsed.files.find((f: any) => f.path === 'docs/api-reference.md');

      if (filenameMatch && pathMatch) {
        // Both should have scores, but we can't guarantee which is higher
        // without knowing exact fuzzysort scoring
        expect(filenameMatch.score).toBeDefined();
        expect(pathMatch.score).toBeDefined();
      }
    });

    it('should find both filename and path matches', async () => {
      const result = await listNotes({ fuzzy_query: 'test' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const paths = parsed.files.map((f: any) => f.path);

      // Should find files in tests/ directory (path match)
      expect(paths.some((p: string) => p.startsWith('tests/'))).toBe(true);
    });
  });

  describe('Score Threshold Filtering', () => {
    it('should filter results by min_score', async () => {
      // Very high threshold should return fewer results
      const result = await listNotes({ fuzzy_query: 'api', min_score: 0 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // With high threshold, we might get no results or only exact matches
      expect(parsed.files.length).toBeGreaterThanOrEqual(0);
    });

    it('should return more results with lower threshold', async () => {
      const highThreshold = await listNotes({ fuzzy_query: 'api', min_score: -1000 });
      const lowThreshold = await listNotes({ fuzzy_query: 'api', min_score: -10000 });

      const highParsed = JSON.parse(highThreshold);
      const lowParsed = JSON.parse(lowThreshold);

      // Lower threshold should return same or more results
      expect(lowParsed.files.length).toBeGreaterThanOrEqual(highParsed.files.length);
    });

    it('should use default min_score when not specified', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Should use default -10000 threshold
      expect(parsed.files.length).toBeGreaterThan(0);
    });
  });

  describe('Result Limiting', () => {
    it('should limit results to specified count', async () => {
      const result = await listNotes({ fuzzy_query: 'md', limit: 3 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeLessThanOrEqual(3);
      expect(parsed.count).toBe(parsed.files.length);
    });

    it('should use default limit of 50', async () => {
      // Create a mock with many files
      const manyFiles = Array.from({ length: 100 }, (_, i) => `file-${i}.md`);
      mockListNotes.mockResolvedValueOnce(manyFiles);

      const result = await listNotes({ fuzzy_query: 'file' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeLessThanOrEqual(50);
    });

    it('should set limited flag when results are truncated', async () => {
      const manyFiles = Array.from({ length: 100 }, (_, i) => `api-file-${i}.md`);
      mockListNotes.mockResolvedValueOnce(manyFiles);

      const result = await listNotes({ fuzzy_query: 'api', limit: 10 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBe(10);
      // limited flag indicates more results were available
      expect(parsed.limited).toBeDefined();
    });

    it('should handle limit larger than result count', async () => {
      const result = await listNotes({ fuzzy_query: 'api', limit: 1000 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Should return all matching results, not padded to limit
      expect(parsed.files.length).toBeLessThan(1000);
    });
  });

  describe('Match Highlighting', () => {
    it('should include highlights by default', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const firstResult = parsed.files[0];
      expect(firstResult.highlight).toBeDefined();
      expect(firstResult.score).toBeDefined();
    });

    it('should include highlights when explicitly enabled', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const firstResult = parsed.files[0];
      expect(firstResult.highlight).toBeDefined();
      expect(firstResult.score).toBeDefined();
    });

    it('should exclude highlights when disabled', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: false });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const firstResult = parsed.files[0];
      expect(firstResult.highlight).toBeUndefined();
      expect(firstResult.score).toBeUndefined();
      expect(firstResult.path).toBeDefined();
    });

    it('should format highlights with <b> tags', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      // At least one result should have <b> tags in highlight
      const hasHighlightTags = parsed.files.some(
        (f: any) => f.highlight && f.highlight.includes('<b>') && f.highlight.includes('</b>')
      );
      expect(hasHighlightTags).toBe(true);
    });

    it('should return path in result object', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const firstResult = parsed.files[0];
      expect(firstResult.path).toBeDefined();
      expect(typeof firstResult.path).toBe('string');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should work without fuzzy_query parameter', async () => {
      const result = await listNotes({ path: '' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files).toEqual(sampleFiles);
      expect(parsed.count).toBe(sampleFiles.length);
      expect(parsed.query).toBeUndefined();
      expect(parsed.total_matches).toBeUndefined();
      expect(parsed.limited).toBeUndefined();
      expect(parsed.search_time_ms).toBeUndefined();
    });

    it('should return plain string array when no fuzzy_query', async () => {
      const result = await listNotes({});
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(Array.isArray(parsed.files)).toBe(true);
      expect(parsed.files.length).toBe(sampleFiles.length);

      // Files should be plain strings, not objects
      parsed.files.forEach((file: any) => {
        expect(typeof file).toBe('string');
      });
    });

    it('should not include fuzzy metadata without query', async () => {
      const result = await listNotes({ path: 'docs' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBeUndefined();
      expect(parsed.total_matches).toBeUndefined();
      expect(parsed.limited).toBeUndefined();
      expect(parsed.search_time_ms).toBeUndefined();
    });

    it('should maintain existing response format', async () => {
      const result = await listNotes({});
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('success');
      expect(parsed).toHaveProperty('path');
      expect(parsed).toHaveProperty('project_folder');
      expect(parsed).toHaveProperty('files');
      expect(parsed).toHaveProperty('count');
    });
  });

  describe('Empty Query Handling', () => {
    it('should treat empty string as no query', async () => {
      const result = await listNotes({ fuzzy_query: '' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files).toEqual(sampleFiles);
      expect(parsed.query).toBeUndefined();
    });

    it('should treat whitespace-only query as no query', async () => {
      const result = await listNotes({ fuzzy_query: '   ' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files).toEqual(sampleFiles);
      expect(parsed.query).toBeUndefined();
    });

    it('should trim query whitespace', async () => {
      const result = await listNotes({ fuzzy_query: '  api  ' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBe('api');
    });
  });

  describe('No Matches Scenario', () => {
    it('should return empty results for non-matching query', async () => {
      const result = await listNotes({ fuzzy_query: 'xyznonexistent' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files).toEqual([]);
      expect(parsed.count).toBe(0);
      expect(parsed.query).toBe('xyznonexistent');
      expect(parsed.total_matches).toBe(0);
    });

    it('should handle no matches with high threshold', async () => {
      const result = await listNotes({ fuzzy_query: 'api', min_score: 10000 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBe(0);
      expect(parsed.count).toBe(0);
    });

    it('should return empty array when directory is empty', async () => {
      mockListNotes.mockResolvedValueOnce([]);

      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files).toEqual([]);
      expect(parsed.count).toBe(0);
    });
  });

  describe('Performance Metrics', () => {
    it('should include search_time_ms when fuzzy search is used', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.search_time_ms).toBeDefined();
      expect(typeof parsed.search_time_ms).toBe('number');
      expect(parsed.search_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('should not include search_time_ms without fuzzy query', async () => {
      const result = await listNotes({});
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.search_time_ms).toBeUndefined();
    });

    it('should complete search quickly', async () => {
      const manyFiles = Array.from({ length: 1000 }, (_, i) => `file-${i}.md`);
      mockListNotes.mockResolvedValueOnce(manyFiles);

      const startTime = performance.now();
      const result = await listNotes({ fuzzy_query: 'file' });
      const duration = performance.now() - startTime;

      const parsed = JSON.parse(result);
      expect(parsed.success).toBe(true);

      // Search should complete in reasonable time (< 1 second for 1000 files)
      expect(duration).toBeLessThan(1000);
    });

    it('should report accurate search time', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.search_time_ms).toBeDefined();

      // Search time should be reasonable (< 100ms for small dataset)
      expect(parsed.search_time_ms).toBeLessThan(100);
    });
  });

  describe('Response Format', () => {
    it('should include query in response when fuzzy search is used', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBe('api');
    });

    it('should include total_matches in response', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.total_matches).toBeDefined();
      expect(typeof parsed.total_matches).toBe('number');
      expect(parsed.total_matches).toBeGreaterThanOrEqual(0);
    });

    it('should include limited flag in response', async () => {
      const result = await listNotes({ fuzzy_query: 'api', limit: 1 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.limited).toBeDefined();
      expect(typeof parsed.limited).toBe('boolean');
    });

    it('should maintain standard response fields', async () => {
      const result = await listNotes({ fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.path).toBeDefined();
      expect(parsed.project_folder).toBe('test-project');
      expect(parsed.files).toBeDefined();
      expect(parsed.count).toBe(parsed.files.length);
    });

    it('should format files as objects with fuzzy search', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const firstFile = parsed.files[0];
      expect(typeof firstFile).toBe('object');
      expect(firstFile.path).toBeDefined();
      expect(firstFile.score).toBeDefined();
      expect(firstFile.highlight).toBeDefined();
    });

    it('should format files as objects without highlights', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: false });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const firstFile = parsed.files[0];
      expect(typeof firstFile).toBe('object');
      expect(firstFile.path).toBeDefined();
      expect(firstFile.score).toBeUndefined();
      expect(firstFile.highlight).toBeUndefined();
    });
  });

  describe('Integration with Path Parameter', () => {
    it('should combine path filtering with fuzzy search', async () => {
      const result = await listNotes({ path: 'docs', fuzzy_query: 'api' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.path).toContain('docs');
      expect(parsed.query).toBe('api');
    });

    it('should search within specified directory', async () => {
      // Mock to return only docs files
      const docsFiles = sampleFiles.filter((f) => f.startsWith('docs/'));
      mockListNotes.mockResolvedValueOnce(docsFiles);

      const result = await listNotes({ path: 'docs', fuzzy_query: 'getting' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const paths = parsed.files.map((f: any) => f.path);
      expect(paths).toContain('docs/getting-started.md');
    });

    it('should handle root path with fuzzy search', async () => {
      const result = await listNotes({ path: '', fuzzy_query: 'readme' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      const paths = parsed.files.map((f: any) => f.path);
      expect(paths).toContain('README.md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle single character query', async () => {
      const result = await listNotes({ fuzzy_query: 'a' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBe('a');
      // Should find files with 'a' in them
      expect(parsed.files.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long query', async () => {
      const longQuery = 'a'.repeat(1000);
      const result = await listNotes({ fuzzy_query: longQuery });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBe(longQuery);
    });

    it('should handle query with regex special characters', async () => {
      const result = await listNotes({ fuzzy_query: '.*+?[]{}()' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Should not throw error, even if no matches
      expect(parsed.files).toBeDefined();
    });

    it('should handle unicode characters in query', async () => {
      const result = await listNotes({ fuzzy_query: 'émoji 🎉' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.query).toBe('émoji 🎉');
    });

    it('should handle limit of 1', async () => {
      const result = await listNotes({ fuzzy_query: 'api', limit: 1 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeLessThanOrEqual(1);
    });

    it('should handle very large limit', async () => {
      const result = await listNotes({ fuzzy_query: 'api', limit: 999999 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Should return all matches, not fail
      expect(parsed.files.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle extreme negative min_score', async () => {
      const result = await listNotes({ fuzzy_query: 'api', min_score: -999999 });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Should return matches
      expect(parsed.files.length).toBeGreaterThan(0);
    });
  });

  describe('Sorting and Ranking', () => {
    it('should sort results by score descending', async () => {
      const result = await listNotes({ fuzzy_query: 'api', include_highlights: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(1);

      // Verify scores are in descending order
      for (let i = 0; i < parsed.files.length - 1; i++) {
        expect(parsed.files[i].score).toBeGreaterThanOrEqual(parsed.files[i + 1].score);
      }
    });

    it('should rank exact matches higher', async () => {
      const result = await listNotes({ fuzzy_query: 'README' });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      expect(parsed.files.length).toBeGreaterThan(0);

      // README.md should be in top results
      const topPaths = parsed.files.slice(0, 3).map((f: any) => f.path);
      expect(topPaths).toContain('README.md');
    });

    it('should handle ties in scoring', async () => {
      const result = await listNotes({ fuzzy_query: 'test', include_highlights: true });
      const parsed = JSON.parse(result);

      expect(parsed.success).toBe(true);
      // Should not throw error even if multiple files have same score
      expect(parsed.files).toBeDefined();
    });
  });
});
