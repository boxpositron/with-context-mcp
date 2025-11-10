import { describe, it, expect } from 'vitest';
import {
  validateConfigSemantic,
  formatValidationResult,
} from '../../src/config/config-validator.js';
import { createDefaultConfig } from '../../src/config/config-parser.js';
import type { WithContextConfig } from '../../src/config/config-parser.js';

describe('Config Validator', () => {
  describe('validateConfigSemantic', () => {
    it('should validate default config with no issues', () => {
      const config = createDefaultConfig();
      const result = validateConfigSemantic(config);

      expect(result.valid).toBe(true);
      // May have warnings about empty patterns
      expect(result.issues.every((i) => i.severity !== 'error')).toBe(true);
    });

    it('should warn about duplicate patterns', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**/*.md', 'README.md'],
        local: ['README.md', 'src/**'],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      expect(result.valid).toBe(true); // Warnings don't invalidate
      const duplicateWarning = result.issues.find((i) => i.message.includes('Duplicate'));
      expect(duplicateWarning).toBeDefined();
      expect(duplicateWarning?.severity).toBe('warning');
    });

    it('should warn about overly broad vault patterns', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**', 'docs/**'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      const broadWarning = result.issues.find((i) => i.message.includes('Overly broad'));
      expect(broadWarning).toBeDefined();
      expect(broadWarning?.field).toBe('vault');
    });

    it('should warn about overly broad local patterns', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: [],
        local: ['**/*'],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      const broadWarning = result.issues.find((i) => i.message.includes('Overly broad'));
      expect(broadWarning).toBeDefined();
      expect(broadWarning?.field).toBe('local');
    });

    it('should provide info when default is vault with no vault patterns', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'vault',
        vault: [],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      const info = result.issues.find(
        (i) => i.severity === 'info' && i.field === 'defaultBehavior'
      );
      expect(info).toBeDefined();
    });

    it('should detect invalid glob patterns with backslashes', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs\\**\\*.md'], // Windows-style path
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      expect(result.valid).toBe(false);
      const error = result.issues.find((i) => i.severity === 'error');
      expect(error).toBeDefined();
      expect(error?.message).toContain('Invalid glob patterns');
    });

    it('should detect invalid patterns with double slashes', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs//files/*.md'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      expect(result.valid).toBe(false);
      const error = result.issues.find((i) => i.severity === 'error');
      expect(error).toBeDefined();
    });

    it('should provide info about empty patterns', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: [],
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);

      const warning = result.issues.find((i) => i.message.includes('No patterns defined'));
      expect(warning).toBeDefined();
    });

    it('should validate multiple patterns without issues', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**/*.md', 'guides/**', 'CHANGELOG.md'],
        local: ['README.md', 'src/**', 'tests/**'],
        conflictResolution: 'most-specific-wins',
      };

      const result = validateConfigSemantic(config);

      expect(result.valid).toBe(true);
      const errors = result.issues.filter((i) => i.severity === 'error');
      expect(errors.length).toBe(0);
    });
  });

  describe('formatValidationResult', () => {
    it('should format valid config', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs/**'],
        local: ['README.md'],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);
      const formatted = formatValidationResult(result);

      expect(formatted).toContain('[OK]');
      expect(formatted).toContain('valid');
    });

    it('should format errors clearly', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['docs\\files'], // Invalid backslash
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);
      const formatted = formatValidationResult(result);

      expect(formatted).toContain('[X]');
      expect(formatted).toContain('ERRORS:');
      expect(formatted).toContain('Invalid glob patterns');
    });

    it('should format warnings clearly', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**'], // Overly broad
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);
      const formatted = formatValidationResult(result);

      expect(formatted).toContain('[!]');
      expect(formatted).toContain('WARNINGS:');
      expect(formatted).toContain('Overly broad');
    });

    it('should include suggestions', () => {
      const config: WithContextConfig = {
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**'],
        local: [],
        conflictResolution: 'local-wins',
      };

      const result = validateConfigSemantic(config);
      const formatted = formatValidationResult(result);

      expect(formatted).toContain('Suggestion:');
    });
  });
});
