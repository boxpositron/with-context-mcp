import { describe, it, expect } from 'vitest';
import {
  parseConfigString,
  createDefaultConfig,
  CONFIG_VERSION,
} from '../../src/config/config-parser.js';
import { ConfigurationError } from '../../src/types/index.js';

describe('Config Parser', () => {
  describe('parseConfigString', () => {
    it('should parse valid minimal config', () => {
      const jsonc = `{
        "version": "2.1"
      }`;

      const config = parseConfigString(jsonc);

      expect(config.version).toBe('2.1');
      expect(config.defaultBehavior).toBe('local'); // Default
      expect(config.vault).toEqual([]);
      expect(config.local).toEqual([]);
      expect(config.conflictResolution).toBe('local-wins');
    });

    it('should parse config with all fields', () => {
      const jsonc = `{
        "version": "2.1",
        "defaultBehavior": "vault",
        "vault": ["docs/**/*.md", "CHANGELOG.md"],
        "local": ["README.md", "src/**"],
        "conflictResolution": "vault-wins"
      }`;

      const config = parseConfigString(jsonc);

      expect(config.version).toBe('2.1');
      expect(config.defaultBehavior).toBe('vault');
      expect(config.vault).toEqual(['docs/**/*.md', 'CHANGELOG.md']);
      expect(config.local).toEqual(['README.md', 'src/**']);
      expect(config.conflictResolution).toBe('vault-wins');
    });

    it('should strip single-line comments', () => {
      const jsonc = `{
        "version": "2.1", // This is a comment
        "defaultBehavior": "local" // Another comment
      }`;

      const config = parseConfigString(jsonc);

      expect(config.version).toBe('2.1');
      expect(config.defaultBehavior).toBe('local');
    });

    it('should strip multi-line comments', () => {
      const jsonc = `{
        /* This is a
           multi-line comment */
        "version": "2.1",
        "defaultBehavior": "local"
      }`;

      const config = parseConfigString(jsonc);

      expect(config.version).toBe('2.1');
      expect(config.defaultBehavior).toBe('local');
    });

    it('should handle trailing commas', () => {
      const jsonc = `{
        "version": "2.1",
        "defaultBehavior": "local",
        "vault": ["docs/**"],
      }`;

      const config = parseConfigString(jsonc);

      expect(config.version).toBe('2.1');
      expect(config.vault).toEqual(['docs/**']);
    });

    it('should throw on missing version', () => {
      const jsonc = `{
        "defaultBehavior": "local"
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('version');
    });

    it('should throw on invalid version', () => {
      const jsonc = `{
        "version": "1.0"
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('Unsupported configuration version');
    });

    it('should throw on invalid defaultBehavior', () => {
      const jsonc = `{
        "version": "2.1",
        "defaultBehavior": "invalid"
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('defaultBehavior');
    });

    it('should throw on invalid vault patterns (not array)', () => {
      const jsonc = `{
        "version": "2.1",
        "vault": "not-an-array"
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('vault');
      expect(() => parseConfigString(jsonc)).toThrow('array');
    });

    it('should throw on empty pattern string', () => {
      const jsonc = `{
        "version": "2.1",
        "vault": [""]
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('non-empty');
    });

    it('should throw on invalid conflictResolution', () => {
      const jsonc = `{
        "version": "2.1",
        "conflictResolution": "invalid"
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('conflictResolution');
    });

    it('should throw on unknown properties', () => {
      const jsonc = `{
        "version": "2.1",
        "unknownProperty": "value"
      }`;

      expect(() => parseConfigString(jsonc)).toThrow(ConfigurationError);
      expect(() => parseConfigString(jsonc)).toThrow('Unknown configuration properties');
    });

    it('should allow $schema property', () => {
      const jsonc = `{
        "$schema": "https://example.com/schema.json",
        "version": "2.1"
      }`;

      expect(() => parseConfigString(jsonc)).not.toThrow();
    });

    it('should accept all valid conflict resolution strategies', () => {
      const strategies = ['local-wins', 'vault-wins', 'most-specific-wins', 'error'];

      for (const strategy of strategies) {
        const jsonc = `{
          "version": "2.1",
          "conflictResolution": "${strategy}"
        }`;

        const config = parseConfigString(jsonc);
        expect(config.conflictResolution).toBe(strategy);
      }
    });
  });

  describe('createDefaultConfig', () => {
    it('should create valid default config', () => {
      const config = createDefaultConfig();

      expect(config.version).toBe(CONFIG_VERSION);
      expect(config.defaultBehavior).toBe('local');
      expect(config.vault).toEqual([]);
      expect(config.local).toEqual([]);
      expect(config.conflictResolution).toBe('local-wins');
    });
  });

  describe('Complex scenarios', () => {
    it('should handle config with many patterns', () => {
      const jsonc = `{
        "version": "2.1",
        "vault": [
          "docs/**/*.md",
          "guides/**",
          "tutorials/**/*.md",
          "CHANGELOG.md",
          "NEWS.md"
        ],
        "local": [
          "README.md",
          "CONTRIBUTING.md",
          "src/**/*.md",
          "tests/**",
          "**/*.draft.md"
        ]
      }`;

      const config = parseConfigString(jsonc);

      expect(config.vault.length).toBe(5);
      expect(config.local.length).toBe(5);
    });

    it('should preserve pattern order', () => {
      const jsonc = `{
        "version": "2.1",
        "vault": ["a", "b", "c"],
        "local": ["x", "y", "z"]
      }`;

      const config = parseConfigString(jsonc);

      expect(config.vault).toEqual(['a', 'b', 'c']);
      expect(config.local).toEqual(['x', 'y', 'z']);
    });
  });
});
