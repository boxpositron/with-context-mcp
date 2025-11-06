import { describe, it, expect } from 'vitest';
import {
  convertIgnoreToConfig,
  generateConfigFromIgnore,
  isLegacyIgnoreFormat,
} from '../../src/config/legacy-ignore-parser.js';
import { parseConfigString } from '../../src/config/config-parser.js';

describe('Legacy Migration', () => {
  describe('convertIgnoreToConfig', () => {
    it('should convert simple ignore file', () => {
      const ignoreContent = `
# Keep README local
README.md

# Keep source docs local
src/**/*.md
`;

      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.version).toBe('2.1');
      expect(config.defaultBehavior).toBe('vault'); // Old behavior
      expect(config.vault).toEqual([]);
      expect(config.local).toEqual(['README.md', 'src/**/*.md']);
      expect(config.conflictResolution).toBe('local-wins');
    });

    it('should handle empty ignore file', () => {
      const config = convertIgnoreToConfig('');

      expect(config.version).toBe('2.1');
      expect(config.local).toEqual([]);
    });

    it('should skip comments', () => {
      const ignoreContent = `
# This is a comment
README.md
# Another comment

# Yet another comment
src/**
`;

      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.local).toEqual(['README.md', 'src/**']);
    });

    it('should skip blank lines', () => {
      const ignoreContent = `
README.md


src/**

`;

      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.local).toEqual(['README.md', 'src/**']);
    });

    it('should handle patterns with various formats', () => {
      const ignoreContent = `
/README.md
docs/
**/*.draft.md
*.tmp
src/**/*.md
`;

      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.local).toContain('/README.md');
      expect(config.local).toContain('docs/');
      expect(config.local).toContain('**/*.draft.md');
      expect(config.local).toContain('*.tmp');
      expect(config.local).toContain('src/**/*.md');
    });

    it('should preserve pattern order', () => {
      const ignoreContent = `
first
second
third
`;

      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.local).toEqual(['first', 'second', 'third']);
    });
  });

  describe('generateConfigFromIgnore', () => {
    it('should generate valid JSONC', () => {
      const ignoreContent = `
README.md
src/**
`;

      const jsonc = generateConfigFromIgnore(ignoreContent);

      // Should be parseable as JSONC
      expect(() => parseConfigString(jsonc)).not.toThrow();

      const config = parseConfigString(jsonc);
      expect(config.version).toBe('2.1');
      expect(config.local).toEqual(['README.md', 'src/**']);
    });

    it('should include helpful comments', () => {
      const jsonc = generateConfigFromIgnore('README.md');

      expect(jsonc).toContain('//');
      expect(jsonc).toContain('version');
      expect(jsonc).toContain('defaultBehavior');
      expect(jsonc).toContain('converted from .withcontextignore');
    });

    it('should include schema reference', () => {
      const jsonc = generateConfigFromIgnore('');

      expect(jsonc).toContain('$schema');
    });

    it('should handle complex ignore files', () => {
      const ignoreContent = `
# Core docs
/README.md
/CONTRIBUTING.md

# Source code docs
src/**/*.md
tests/**/*.md

# Build output
dist/
node_modules/

# Drafts
**/*.draft.md
`;

      const jsonc = generateConfigFromIgnore(ignoreContent);
      const config = parseConfigString(jsonc);

      expect(config.local.length).toBe(7);
      expect(config.local).toContain('/README.md');
      expect(config.local).toContain('**/*.draft.md');
    });
  });

  describe('isLegacyIgnoreFormat', () => {
    it('should detect empty file as legacy', () => {
      expect(isLegacyIgnoreFormat('')).toBe(true);
    });

    it('should detect comment-only file as legacy', () => {
      expect(isLegacyIgnoreFormat('# Just comments')).toBe(true);
    });

    it('should detect pattern file as legacy', () => {
      expect(isLegacyIgnoreFormat('README.md\nsrc/**')).toBe(true);
    });

    it('should detect file starting with # as legacy', () => {
      expect(isLegacyIgnoreFormat('# Comment\nREADME.md')).toBe(true);
    });

    it('should detect file starting with / as legacy', () => {
      expect(isLegacyIgnoreFormat('/README.md')).toBe(true);
    });

    it('should detect file starting with * as legacy', () => {
      expect(isLegacyIgnoreFormat('*.md')).toBe(true);
    });

    it('should detect JSON file as NOT legacy', () => {
      const json = `{
        "version": "2.1",
        "defaultBehavior": "local"
      }`;

      expect(isLegacyIgnoreFormat(json)).toBe(false);
    });

    it('should detect JSONC with comments as NOT legacy', () => {
      const jsonc = `{
        // Comment
        "version": "2.1"
      }`;

      expect(isLegacyIgnoreFormat(jsonc)).toBe(false);
    });

    it('should detect file with JSON keywords as NOT legacy', () => {
      expect(isLegacyIgnoreFormat('"version": "2.1"')).toBe(false);
      expect(isLegacyIgnoreFormat('"defaultBehavior": "local"')).toBe(false);
    });
  });

  describe('Migration equivalence', () => {
    it('should preserve delegation behavior for matching files', () => {
      // In old format: README.md is in .withcontextignore = stays local
      // In new format: README.md is in local[] = stays local
      const ignoreContent = 'README.md';
      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.local).toContain('README.md');
      expect(config.defaultBehavior).toBe('vault'); // Non-matches delegate
    });

    it('should preserve delegation behavior for non-matching files', () => {
      // Old format: files NOT in .withcontextignore = delegate to vault
      // New format: defaultBehavior = vault for non-matches
      const ignoreContent = 'README.md'; // Only README is local
      const config = convertIgnoreToConfig(ignoreContent);

      expect(config.defaultBehavior).toBe('vault');
      // docs/guide.md would NOT match local patterns → delegates to vault
    });

    it('should handle typical project .withcontextignore', () => {
      const ignoreContent = `
# Keep main docs local
/README.md
/CONTRIBUTING.md
/AGENTS.md

# Keep source docs local
src/**/*.md
tests/**/*.md

# Keep build output local
dist/
node_modules/
`;

      const config = convertIgnoreToConfig(ignoreContent);

      // All these should be in local array
      expect(config.local).toContain('/README.md');
      expect(config.local).toContain('src/**/*.md');
      expect(config.local).toContain('dist/');

      // Other files (like docs/**) would delegate to vault
      expect(config.defaultBehavior).toBe('vault');
    });
  });
});
