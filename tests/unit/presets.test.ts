/**
 * Unit tests for vault organization presets
 *
 * Tests preset strategies, rule matching, and plan generation
 */

import { describe, it, expect } from 'vitest';
import { getPreset, listPresets, applyPreset } from '../../src/vault-organizer/presets.js';
import type { VaultStructure, VaultFileInfo } from '../../src/vault-organizer/types.js';

describe('Preset System', () => {
  describe('getPreset', () => {
    it('should return clean preset', () => {
      const preset = getPreset('clean');
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('clean');
      expect(preset?.name).toBe('Clean');
      expect(preset?.rules.length).toBeGreaterThan(0);
    });

    it('should return minimal preset', () => {
      const preset = getPreset('minimal');
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('minimal');
      expect(preset?.name).toBe('Minimal');
    });

    it('should return docs-as-code preset', () => {
      const preset = getPreset('docs-as-code');
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('docs-as-code');
      expect(preset?.name).toBe('Docs-as-Code');
    });

    it('should return research preset', () => {
      const preset = getPreset('research');
      expect(preset).toBeDefined();
      expect(preset?.id).toBe('research');
      expect(preset?.name).toBe('Research');
    });

    it('should return null for unknown preset', () => {
      const preset = getPreset('unknown');
      expect(preset).toBeNull();
    });
  });

  describe('listPresets', () => {
    it('should return all available presets', () => {
      const presets = listPresets();
      expect(presets.length).toBe(4);
      expect(presets.map((p) => p.id)).toContain('clean');
      expect(presets.map((p) => p.id)).toContain('minimal');
      expect(presets.map((p) => p.id)).toContain('docs-as-code');
      expect(presets.map((p) => p.id)).toContain('research');
    });

    it('should return presets with required properties', () => {
      const presets = listPresets();
      presets.forEach((preset) => {
        expect(preset).toHaveProperty('id');
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('essentialFiles');
        expect(preset).toHaveProperty('rules');
        expect(preset.rules.length).toBeGreaterThan(0);
      });
    });
  });

  describe('applyPreset - Clean Preset', () => {
    it('should organize architecture docs correctly', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/architecture-decision-record.md'),
        createMockFile('projects/test-project/system-design.md'),
        createMockFile('projects/test-project/technical-design.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(3);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('docs/architecture');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should organize API docs correctly', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/api-reference.md'),
        createMockFile('projects/test-project/rest-api.md'),
        createMockFile('projects/test-project/graphql-schema.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(3);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('docs/api');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should organize guides correctly', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/getting-started-guide.md'),
        createMockFile('projects/test-project/tutorial-basics.md'),
        createMockFile('projects/test-project/how-to-deploy.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(3);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('docs/guides');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    it('should organize meeting notes with year extraction', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/meeting-2024-01-15.md', '2024-01-15T10:00:00Z'),
        createMockFile('projects/test-project/standup-2024-02-20.md', '2024-02-20T09:00:00Z'),
        createMockFile('projects/test-project/retrospective-2023-12-10.md', '2023-12-10T14:00:00Z'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(3);

      const meeting2024 = plan.suggestions.filter((s) => s.suggestedPath?.includes('2024'));
      const meeting2023 = plan.suggestions.filter((s) => s.suggestedPath?.includes('2023'));

      expect(meeting2024.length).toBe(2);
      expect(meeting2023.length).toBe(1);

      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('meetings/{YEAR}');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.9);
      });
    });

    it('should organize planning docs correctly', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/roadmap.md'),
        createMockFile('projects/test-project/sprint-planning.md'),
        createMockFile('projects/test-project/project-plan.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(3);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('planning');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    it('should organize research notes correctly', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/research-findings.md'),
        createMockFile('projects/test-project/spike-investigation.md'),
        createMockFile('projects/test-project/poc-results.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(3);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('research');
        expect(suggestion.confidence).toBeGreaterThanOrEqual(0.85);
      });
    });

    it('should catch unmatched files in docs folder', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/random-notes.md'),
        createMockFile('projects/test-project/misc-doc.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(2);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('docs');
        expect(suggestion.confidence).toBeLessThanOrEqual(0.75);
      });
    });

    it('should skip essential files', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/README.md'),
        createMockFile('projects/test-project/AGENTS.md'),
        createMockFile('projects/test-project/LICENSE'),
        createMockFile('projects/test-project/CONTRIBUTING.md'),
        createMockFile('projects/test-project/.github/workflows/ci.yml'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(0);
    });

    it('should calculate estimated impact correctly', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/api-doc.md'),
        createMockFile('projects/test-project/guide.md'),
        createMockFile('projects/test-project/meeting.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.estimatedImpact.filesToMove).toBeGreaterThan(0);
      expect(plan.estimatedImpact.estimatedDuration).toBeGreaterThan(0);
    });
  });

  describe('applyPreset - Minimal Preset', () => {
    it('should only organize ADRs and research', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/architecture-decision.md'),
        createMockFile('projects/test-project/research-notes.md'),
        createMockFile('projects/test-project/api-doc.md'),
        createMockFile('projects/test-project/guide.md'),
      ]);

      const preset = getPreset('minimal')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(2);
      const categories = plan.suggestions.map((s) => s.targetCategory);
      expect(categories).toContain('decisions');
      expect(categories).toContain('research');
    });
  });

  describe('applyPreset - Docs-as-Code Preset', () => {
    it('should preserve directory structure', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/docs/api.md'),
        createMockFile('projects/test-project/docs/guide.md'),
      ]);

      const preset = getPreset('docs-as-code')!;
      const plan = applyPreset(preset, vaultStructure);

      // Docs-as-code should preserve paths, so no changes needed
      expect(plan.suggestions.length).toBe(0);
    });
  });

  describe('applyPreset - Research Preset', () => {
    it('should organize literature reviews', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/literature-review.md'),
        createMockFile('projects/test-project/paper-notes.md'),
      ]);

      const preset = getPreset('research')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(2);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('research/literature');
      });
    });

    it('should organize experiments', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/experiment-results.md'),
        createMockFile('projects/test-project/benchmark-analysis.md'),
      ]);

      const preset = getPreset('research')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.suggestions.length).toBe(2);
      plan.suggestions.forEach((suggestion) => {
        expect(suggestion.targetCategory).toBe('research/experiments');
      });
    });
  });

  describe('Plan Properties', () => {
    it('should include all required plan properties', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/test.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan).toHaveProperty('generatedAt');
      expect(plan).toHaveProperty('suggestions');
      expect(plan).toHaveProperty('estimatedImpact');
      expect(plan).toHaveProperty('warnings');
      expect(plan).toHaveProperty('summary');
      expect(plan).toHaveProperty('requiresManualReview');
    });

    it('should generate proper summary', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/api.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      expect(plan.summary).toContain('Clean');
      expect(plan.summary).toContain('suggestions');
    });

    it('should mark risky operations for review', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFileWithBacklinks('projects/test-project/heavily-linked.md', 15),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      if (plan.suggestions.length > 0) {
        const highRiskSuggestions = plan.suggestions.filter((s) => s.impact.complexity === 'high');
        if (highRiskSuggestions.length > 0) {
          expect(plan.requiresManualReview).toBe(true);
        }
      }
    });
  });

  describe('Suggestion Properties', () => {
    it('should include operation type', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/api.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      if (plan.suggestions.length > 0) {
        const suggestion = plan.suggestions[0];
        expect(['move', 'rename', 'both']).toContain(suggestion.type);
      }
    });

    it('should include confidence scores', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/architecture.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      if (plan.suggestions.length > 0) {
        plan.suggestions.forEach((suggestion) => {
          expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
          expect(suggestion.confidence).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should include impact assessment', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/test.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      if (plan.suggestions.length > 0) {
        const suggestion = plan.suggestions[0];
        expect(suggestion.impact).toHaveProperty('affectedFiles');
        expect(suggestion.impact).toHaveProperty('linksToUpdate');
        expect(suggestion.impact).toHaveProperty('potentialBrokenLinks');
        expect(suggestion.impact).toHaveProperty('complexity');
        expect(['low', 'medium', 'high']).toContain(suggestion.impact.complexity);
      }
    });
  });

  describe('Rule Priority', () => {
    it('should apply highest priority rule first', () => {
      const vaultStructure = createMockVaultStructure([
        createMockFile('projects/test-project/architecture-api-guide.md'),
      ]);

      const preset = getPreset('clean')!;
      const plan = applyPreset(preset, vaultStructure);

      // Should match architecture (priority 100) before API (priority 95)
      if (plan.suggestions.length > 0) {
        const suggestion = plan.suggestions[0];
        expect(suggestion.targetCategory).toBe('docs/architecture');
      }
    });
  });
});

// ==================== Helper Functions ====================

/**
 * Creates a mock vault structure for testing
 */
function createMockVaultStructure(files: VaultFileInfo[]): VaultStructure {
  return {
    rootPath: 'projects/test-project',
    totalFiles: files.length,
    totalSize: files.reduce((sum, f) => sum + f.size, 0),
    analyzedAt: new Date().toISOString(),
    files,
    folders: {},
    categories: {},
    orphanFiles: [],
  };
}

/**
 * Creates a mock file for testing
 */
function createMockFile(path: string, created?: string): VaultFileInfo {
  const name = path.split('/').pop() || path;
  return {
    path,
    name,
    extension: 'md',
    size: 1024,
    created: created || new Date().toISOString(),
    modified: new Date().toISOString(),
    contentMetadata: {
      headings: [],
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
}

/**
 * Creates a mock file with backlinks for testing impact
 */
function createMockFileWithBacklinks(path: string, backlinkCount: number): VaultFileInfo {
  const file = createMockFile(path);
  const backlinks = Array.from({ length: backlinkCount }, (_, i) => `backlink-${i}.md`);

  return {
    ...file,
    contentMetadata: {
      ...file.contentMetadata!,
      backlinks,
    },
  };
}
