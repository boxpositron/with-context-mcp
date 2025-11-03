/**
 * Unit tests for sync-notes vault to local logic fix
 *
 * Bug: Files in vault that do not match delegation patterns (like README.md with negation)
 * were incorrectly staying in vault instead of being moved back to local.
 */

import { describe, it, expect } from 'vitest';
import { IgnorePatternMatcher } from '../../src/doc-delegator/ignore-pattern-matcher.js';

describe('sync-notes vault→local logic', () => {
  const ignoreContent = `
# Ignore all markdown files by default
**/*.md

# But keep README.md files local
!**/README.md
!README.md
!AGENTS.md
`;

  it('should identify README.md files as NOT delegated (should stay local)', () => {
    const matcher = new IgnorePatternMatcher();
    matcher.parsePatterns(ignoreContent);

    const readmeFiles = [
      'README.md',
      'plugin/README.md',
      'src/templates/README.md',
      'docs/api/README.md',
    ];

    readmeFiles.forEach((file) => {
      const shouldDelegate = matcher.isIgnored(file);
      expect(shouldDelegate).toBe(false);
    });
  });

  it('should identify non-README .md files as delegated (should be in vault)', () => {
    const matcher = new IgnorePatternMatcher();
    matcher.parsePatterns(ignoreContent);

    const delegatedFiles = [
      'CHANGELOG.md',
      'src/templates/QUICK_START.md',
      'examples/withcontextignore-examples.md',
      'docs/guide.md',
    ];

    delegatedFiles.forEach((file) => {
      const shouldDelegate = matcher.isIgnored(file);
      expect(shouldDelegate).toBe(true);
    });
  });

  it('should respect explicit negation patterns', () => {
    const matcher = new IgnorePatternMatcher();
    matcher.parsePatterns(ignoreContent);

    // These have explicit negation patterns
    expect(matcher.isIgnored('AGENTS.md')).toBe(false);
    expect(matcher.isIgnored('README.md')).toBe(false);
  });

  describe('vault→local movement logic', () => {
    it('files in vault that should NOT be delegated should be moved to local', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(ignoreContent);

      // Simulate files currently in vault
      const vaultFiles = ['plugin/README.md', 'src/templates/README.md'];

      const filesToMoveToLocal = vaultFiles.filter((file) => {
        const shouldDelegate = matcher.isIgnored(file);
        // Correct logic: if !shouldDelegate, move to local
        return !shouldDelegate;
      });

      expect(filesToMoveToLocal).toEqual(['plugin/README.md', 'src/templates/README.md']);
    });

    it('files in vault that SHOULD be delegated should stay in vault', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(ignoreContent);

      // Simulate files currently in vault
      const vaultFiles = ['examples/withcontextignore-examples.md', 'src/templates/QUICK_START.md'];

      const filesToMoveToLocal = vaultFiles.filter((file) => {
        const shouldDelegate = matcher.isIgnored(file);
        // Correct logic: if !shouldDelegate, move to local
        return !shouldDelegate;
      });

      // These files should stay in vault (not moved), so array should be empty
      expect(filesToMoveToLocal).toEqual([]);
    });

    it('mixed vault state should correctly separate files', () => {
      const matcher = new IgnorePatternMatcher();
      matcher.parsePatterns(ignoreContent);

      // Simulate mixed state: some files that should be in vault, some that shouldn't
      const vaultFiles = [
        'plugin/README.md', // Should NOT be in vault → move to local
        'src/templates/README.md', // Should NOT be in vault → move to local
        'examples/withcontextignore-examples.md', // Should be in vault → stay
        'src/templates/QUICK_START.md', // Should be in vault → stay
      ];

      const filesToMoveToLocal = vaultFiles.filter((file) => {
        const shouldDelegate = matcher.isIgnored(file);
        return !shouldDelegate;
      });

      const filesToStayInVault = vaultFiles.filter((file) => {
        const shouldDelegate = matcher.isIgnored(file);
        return shouldDelegate;
      });

      expect(filesToMoveToLocal).toEqual(['plugin/README.md', 'src/templates/README.md']);
      expect(filesToStayInVault).toEqual([
        'examples/withcontextignore-examples.md',
        'src/templates/QUICK_START.md',
      ]);
    });
  });
});
