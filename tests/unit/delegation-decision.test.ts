import { describe, it, expect } from 'vitest';
import {
  decideDelegation,
  decideDelegationWithReasoning,
  decideDelegationBatch,
} from '../../src/doc-delegator/delegation-decision.js';
import type { WithContextConfig } from '../../src/config/config-parser.js';
import { ConfigurationError } from '../../src/types/index.js';

describe('Delegation Decision', () => {
  describe('decideDelegation', () => {
    it('should use default behavior when no patterns match', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: [],
        local: [],
        conflictResolution: 'local-wins',
      };

      const decision = decideDelegation('some-file.md', config);
      expect(decision).toBe('local');
    });

    it('should delegate when file matches vault pattern', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**/*.md'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const decision = decideDelegation('docs/api/guide.md', config);
      expect(decision).toBe('vault');
    });

    it('should keep local when file matches local pattern', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'vault',
        vault: [],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const decision = decideDelegation('README.md', config);
      expect(decision).toBe('local');
    });

    it('should apply local-wins conflict resolution', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const decision = decideDelegation('README.md', config);
      expect(decision).toBe('local');
    });

    it('should apply vault-wins conflict resolution', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'],
        local: ['README.md'],
        conflictResolution: 'vault-wins',
      };

      const decision = decideDelegation('README.md', config);
      expect(decision).toBe('vault');
    });

    it('should apply most-specific-wins (local more specific)', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'], // Less specific
        local: ['README.md'], // More specific (exact match)
        conflictResolution: 'most-specific-wins',
      };

      const decision = decideDelegation('README.md', config);
      expect(decision).toBe('local');
    });

    it('should apply most-specific-wins (vault more specific)', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/api/guide.md'], // More specific (exact path)
        local: ['docs/**'], // Less specific
        conflictResolution: 'most-specific-wins',
      };

      const decision = decideDelegation('docs/api/guide.md', config);
      expect(decision).toBe('vault');
    });

    it('should throw on error conflict resolution', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'],
        local: ['README.md'],
        conflictResolution: 'error',
      };

      expect(() => decideDelegation('README.md', config)).toThrow(ConfigurationError);
      expect(() => decideDelegation('README.md', config)).toThrow('Conflict detected');
    });

    it('should handle paths with leading slash', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const decision = decideDelegation('/docs/file.md', config);
      expect(decision).toBe('vault');
    });

    it('should handle paths with ./ prefix', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const decision = decideDelegation('./docs/file.md', config);
      expect(decision).toBe('vault');
    });

    it('should match file extensions correctly', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'],
        local: [],
        conflictResolution: 'local-wins',
      };

      expect(decideDelegation('file.md', config)).toBe('vault');
      expect(decideDelegation('file.txt', config)).toBe('local');
    });

    it('should match directory patterns', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**'],
        local: [],
        conflictResolution: 'local-wins',
      };

      expect(decideDelegation('docs/guide.md', config)).toBe('vault');
      expect(decideDelegation('docs/api/reference.md', config)).toBe('vault');
      expect(decideDelegation('src/code.ts', config)).toBe('local');
    });
  });

  describe('decideDelegationWithReasoning', () => {
    it('should provide reasoning for default behavior', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: [],
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = decideDelegationWithReasoning('file.md', config);

      expect(result.decision).toBe('local');
      expect(result.reason).toContain('default behavior');
      expect(result.matchedVaultPattern).toBeUndefined();
      expect(result.matchedLocalPattern).toBeUndefined();
    });

    it('should provide reasoning for vault match', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**/*.md'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = decideDelegationWithReasoning('docs/guide.md', config);

      expect(result.decision).toBe('vault');
      expect(result.reason).toContain('Matched vault pattern');
      expect(result.matchedVaultPattern).toBe('docs/**/*.md');
      expect(result.vaultSpecificity).toBeGreaterThan(0);
    });

    it('should provide reasoning for local match', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'vault',
        vault: [],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const result = decideDelegationWithReasoning('README.md', config);

      expect(result.decision).toBe('local');
      expect(result.reason).toContain('Matched local pattern');
      expect(result.matchedLocalPattern).toBe('README.md');
      expect(result.localSpecificity).toBeGreaterThan(0);
    });

    it('should provide reasoning for conflict resolution', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const result = decideDelegationWithReasoning('README.md', config);

      expect(result.decision).toBe('local');
      expect(result.reason).toContain('Matched both');
      expect(result.reason).toContain('local-wins');
      expect(result.matchedVaultPattern).toBe('**/*.md');
      expect(result.matchedLocalPattern).toBe('README.md');
    });

    it('should show specificity in most-specific-wins reasoning', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**/*.md'],
        local: ['README.md'],
        conflictResolution: 'most-specific-wins',
      };

      const result = decideDelegationWithReasoning('README.md', config);

      expect(result.reason).toContain('specificity');
      expect(result.vaultSpecificity).toBeDefined();
      expect(result.localSpecificity).toBeDefined();
    });
  });

  describe('decideDelegationBatch', () => {
    it('should process multiple files', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**'],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const files = ['README.md', 'docs/guide.md', 'src/code.ts'];
      const results = decideDelegationBatch(files, config);

      expect(results.size).toBe(3);
      expect(results.get('README.md')).toBe('local');
      expect(results.get('docs/guide.md')).toBe('vault');
      expect(results.get('src/code.ts')).toBe('local');
    });

    it('should handle empty file list', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: [],
        local: [],
        conflictResolution: 'local-wins',
      };

      const results = decideDelegationBatch([], config);
      expect(results.size).toBe(0);
    });
  });
});
