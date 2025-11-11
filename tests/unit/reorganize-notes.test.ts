import { describe, it, expect } from 'vitest';
import { reorganizeNotesSchema } from '../../src/tools/reorganize-notes.js';

describe('reorganizeNotesSchema', () => {
  it('should validate a minimal valid plan', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'move',
            currentPath: 'file.md',
            suggestedPath: 'docs/file.md',
            reason: 'Better organization',
            confidence: 0.85,
          },
        ],
      },
    };

    const result = reorganizeNotesSchema.parse(input);
    expect(result).toBeDefined();
    expect(result.dry_run).toBe(true); // Default value
    expect(result.update_links).toBe(true); // Default value
    expect(result.create_backup).toBe(true); // Default value
    expect(result.min_confidence).toBe(0.7); // Default value
  });

  it('should validate a complete plan with all fields', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'both',
            currentPath: 'old/unclear.md',
            suggestedPath: 'docs/architecture',
            suggestedName: 'system-architecture',
            reason: 'Better organization and naming',
            confidence: 0.95,
            impact: {
              affectedFiles: 5,
              linksToUpdate: 12,
              potentialBrokenLinks: ['obsolete.md'],
              complexity: 'medium',
            },
            targetCategory: 'documentation',
          },
        ],
        estimatedImpact: {
          filesToMove: 1,
          filesToRename: 1,
          linksToUpdate: 12,
          filesRequiringLinkUpdates: 5,
          estimatedDuration: 3000,
          hasRiskyOperations: false,
        },
        warnings: [
          {
            severity: 'warning',
            filePath: 'obsolete.md',
            message: 'This file may be obsolete',
            suggestion: 'Review and update',
          },
        ],
        summary: 'Reorganize 1 file',
        requiresManualReview: false,
      },
      dry_run: false,
      update_links: true,
      create_backup: true,
      min_confidence: 0.8,
    };

    const result = reorganizeNotesSchema.parse(input);
    expect(result).toBeDefined();
    expect(result.dry_run).toBe(false);
    expect(result.min_confidence).toBe(0.8);
    expect(result.plan.suggestions).toHaveLength(1);
    expect(result.plan.suggestions[0].type).toBe('both');
  });

  it('should validate rename operation', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'rename',
            currentPath: 'unclear-name.md',
            suggestedName: 'clear-name',
            reason: 'Improve clarity',
            confidence: 0.9,
          },
        ],
      },
    };

    const result = reorganizeNotesSchema.parse(input);
    expect(result.plan.suggestions[0].type).toBe('rename');
    expect(result.plan.suggestions[0].suggestedName).toBe('clear-name');
  });

  it('should reject invalid confidence values', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'move',
            currentPath: 'file.md',
            suggestedPath: 'docs/file.md',
            reason: 'Better organization',
            confidence: 1.5, // Invalid: > 1
          },
        ],
      },
    };

    expect(() => reorganizeNotesSchema.parse(input)).toThrow();
  });

  it('should reject invalid min_confidence values', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'move',
            currentPath: 'file.md',
            suggestedPath: 'docs/file.md',
            reason: 'Better organization',
            confidence: 0.8,
          },
        ],
      },
      min_confidence: -0.1, // Invalid: < 0
    };

    expect(() => reorganizeNotesSchema.parse(input)).toThrow();
  });

  it('should reject missing required fields', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'move',
            currentPath: 'file.md',
            // Missing suggestedPath, reason, and confidence
          },
        ],
      },
    };

    expect(() => reorganizeNotesSchema.parse(input)).toThrow();
  });

  it('should reject invalid operation type', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'invalid-type',
            currentPath: 'file.md',
            suggestedPath: 'docs/file.md',
            reason: 'Better organization',
            confidence: 0.8,
          },
        ],
      },
    };

    expect(() => reorganizeNotesSchema.parse(input)).toThrow();
  });

  it('should allow empty suggestions array', () => {
    const input = {
      plan: {
        suggestions: [],
      },
    };

    const result = reorganizeNotesSchema.parse(input);
    expect(result.plan.suggestions).toHaveLength(0);
  });

  it('should validate multiple suggestions', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'move',
            currentPath: 'file1.md',
            suggestedPath: 'docs/file1.md',
            reason: 'Better organization',
            confidence: 0.85,
          },
          {
            type: 'rename',
            currentPath: 'file2.md',
            suggestedName: 'better-name',
            reason: 'Improve clarity',
            confidence: 0.9,
          },
          {
            type: 'both',
            currentPath: 'file3.md',
            suggestedPath: 'docs',
            suggestedName: 'file3-renamed',
            reason: 'Move and rename',
            confidence: 0.95,
          },
        ],
      },
    };

    const result = reorganizeNotesSchema.parse(input);
    expect(result.plan.suggestions).toHaveLength(3);
    expect(result.plan.suggestions[0].type).toBe('move');
    expect(result.plan.suggestions[1].type).toBe('rename');
    expect(result.plan.suggestions[2].type).toBe('both');
  });

  it('should apply default values for optional impact fields', () => {
    const input = {
      plan: {
        suggestions: [
          {
            type: 'move',
            currentPath: 'file.md',
            suggestedPath: 'docs/file.md',
            reason: 'Better organization',
            confidence: 0.85,
            impact: {}, // Empty impact object
          },
        ],
      },
    };

    const result = reorganizeNotesSchema.parse(input);
    const impact = result.plan.suggestions[0].impact;
    expect(impact).toBeDefined();
    expect(impact?.affectedFiles).toBe(0);
    expect(impact?.linksToUpdate).toBe(0);
    expect(impact?.potentialBrokenLinks).toEqual([]);
    expect(impact?.complexity).toBe('low');
  });
});
