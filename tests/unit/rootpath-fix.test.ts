import { describe, it, expect } from 'vitest';
import { applyPreset, getPreset } from '../../src/vault-organizer/presets.js';
import type { VaultStructure } from '../../src/vault-organizer/types.js';

describe('Root Path Fix', () => {
  it('should not create nested docs/docs structure when file is already in docs folder', () => {
    // Simulate vault structure with correct project root
    const vaultStructure: VaultStructure = {
      rootPath: 'Projects/with-context-mcp', // Correct project root
      totalFiles: 1,
      totalSize: 10000,
      analyzedAt: new Date().toISOString(),
      files: [
        {
          path: 'Projects/with-context-mcp/docs/path_usage_guidelines.md',
          name: 'path_usage_guidelines.md',
          extension: 'md',
          size: 10000,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          keywords: ['path', 'usage', 'guidelines'],
          topics: ['documentation'],
        },
      ],
      folders: {},
      categories: {},
      orphanFiles: [],
    };

    const preset = getPreset('clean');
    expect(preset).not.toBeNull();

    const plan = applyPreset(preset!, vaultStructure);

    // File is already in docs folder, should not suggest moving to docs/docs
    expect(plan.suggestions).toHaveLength(0);
  });

  it('should suggest moving file from root to docs folder', () => {
    // File at project root should be moved to docs
    const vaultStructure: VaultStructure = {
      rootPath: 'Projects/with-context-mcp',
      totalFiles: 1,
      totalSize: 1000,
      analyzedAt: new Date().toISOString(),
      files: [
        {
          path: 'Projects/with-context-mcp/random_file.md',
          name: 'random_file.md',
          extension: 'md',
          size: 1000,
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          keywords: [],
          topics: [],
        },
      ],
      folders: {},
      categories: {},
      orphanFiles: [],
    };

    const preset = getPreset('clean');
    const plan = applyPreset(preset!, vaultStructure);

    // Should suggest moving from root to docs
    expect(plan.suggestions).toHaveLength(1);
    expect(plan.suggestions[0].currentPath).toBe('Projects/with-context-mcp/random_file.md');
    expect(plan.suggestions[0].suggestedPath).toBe('Projects/with-context-mcp/docs/random_file.md');
    expect(plan.suggestions[0].type).toBe('move');
  });

  it('should extract project root correctly from file paths', () => {
    // Test the regex pattern that extracts project root
    const testCases = [
      {
        input: 'Projects/with-context-mcp/docs/file.md',
        expected: 'Projects/with-context-mcp',
      },
      {
        input: 'Projects/my-project/subfolder/deep/file.md',
        expected: 'Projects/my-project',
      },
      {
        input: 'Projects/test/file.md',
        expected: 'Projects/test',
      },
    ];

    for (const { input, expected } of testCases) {
      const match = input.match(/^(Projects\/[^/]+)/);
      expect(match).not.toBeNull();
      expect(match![1]).toBe(expected);
    }
  });
});
