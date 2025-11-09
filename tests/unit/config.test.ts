import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadConfig } from '../../src/config/index.js';

describe('Config', () => {
  beforeEach(() => {
    // Reset environment variables before each test
    vi.resetModules();
  });

  describe('loadConfig', () => {
    it('should load configuration with required Obsidian fields', () => {
      const config = loadConfig();

      expect(config).toHaveProperty('obsidianApiUrl');
      expect(config).toHaveProperty('obsidianApiKey');
      expect(config).toHaveProperty('obsidianVault');
      expect(typeof config.obsidianApiUrl).toBe('string');
      expect(typeof config.obsidianApiKey).toBe('string');
      expect(typeof config.obsidianVault).toBe('string');
    });

    it('should have valid log level', () => {
      const config = loadConfig();

      expect(['error', 'warn', 'info', 'debug']).toContain(config.logLevel);
    });

    it('should have valid node environment', () => {
      const config = loadConfig();

      expect(['development', 'production']).toContain(config.nodeEnv);
    });

    it('should have project configuration', () => {
      const config = loadConfig();

      expect(config).toHaveProperty('projectBasePath');
      expect(typeof config.projectBasePath).toBe('string');
    });
  });
});
