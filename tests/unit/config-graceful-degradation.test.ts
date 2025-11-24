/**
 * Tests for graceful configuration degradation
 *
 * Ensures the plugin doesn't crash when required environment variables are missing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Store original env vars
const originalEnv = { ...process.env };

describe('Config Graceful Degradation', () => {
  beforeEach(() => {
    // Clear config cache before each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  describe('loadConfigSafe', () => {
    it('should not throw when OBSIDIAN_API_KEY is missing', async () => {
      // Remove required env vars
      delete process.env.OBSIDIAN_API_KEY;
      delete process.env.OBSIDIAN_VAULT;

      // Import fresh module
      const { loadConfigSafe } = await import('../../src/config/index.js');

      // Should not throw
      expect(() => loadConfigSafe()).not.toThrow();

      const state = loadConfigSafe();
      expect(state.isValid).toBe(false);
      expect(state.missingFields).toContain('OBSIDIAN_API_KEY');
      expect(state.missingFields).toContain('OBSIDIAN_VAULT');
    });

    it('should return valid state when all required vars are present', async () => {
      // Set required env vars
      process.env.OBSIDIAN_API_KEY = 'test-key';
      process.env.OBSIDIAN_VAULT = 'test-vault';
      process.env.OBSIDIAN_API_URL = 'https://127.0.0.1:27124';

      const { loadConfigSafe } = await import('../../src/config/index.js');

      const state = loadConfigSafe();
      expect(state.isValid).toBe(true);
      expect(state.missingFields).toHaveLength(0);
      expect(state.errors).toHaveLength(0);
      expect(state.config.obsidianApiKey).toBe('test-key');
      expect(state.config.obsidianVault).toBe('test-vault');
    });

    it('should detect invalid OBSIDIAN_API_URL', async () => {
      process.env.OBSIDIAN_API_KEY = 'test-key';
      process.env.OBSIDIAN_VAULT = 'test-vault';
      process.env.OBSIDIAN_API_URL = 'not-a-valid-url';

      const { loadConfigSafe } = await import('../../src/config/index.js');

      const state = loadConfigSafe();
      expect(state.isValid).toBe(false);
      expect(state.errors).toContain('OBSIDIAN_API_URL is not a valid URL');
    });

    it('should cache config state', async () => {
      process.env.OBSIDIAN_API_KEY = 'test-key';
      process.env.OBSIDIAN_VAULT = 'test-vault';

      const { loadConfigSafe } = await import('../../src/config/index.js');

      const state1 = loadConfigSafe();
      const state2 = loadConfigSafe();

      // Should return the same cached object
      expect(state1).toBe(state2);
    });
  });

  describe('isConfigValid', () => {
    it('should return false when config is missing', async () => {
      delete process.env.OBSIDIAN_API_KEY;
      delete process.env.OBSIDIAN_VAULT;

      const { isConfigValid } = await import('../../src/config/index.js');

      expect(isConfigValid()).toBe(false);
    });

    it('should return true when config is valid', async () => {
      process.env.OBSIDIAN_API_KEY = 'test-key';
      process.env.OBSIDIAN_VAULT = 'test-vault';

      const { isConfigValid } = await import('../../src/config/index.js');

      expect(isConfigValid()).toBe(true);
    });
  });

  describe('getConfigErrorMessage', () => {
    it('should return null when config is valid', async () => {
      process.env.OBSIDIAN_API_KEY = 'test-key';
      process.env.OBSIDIAN_VAULT = 'test-vault';

      const { getConfigErrorMessage } = await import('../../src/config/index.js');

      expect(getConfigErrorMessage()).toBeNull();
    });

    it('should return helpful message when config is missing', async () => {
      delete process.env.OBSIDIAN_API_KEY;
      delete process.env.OBSIDIAN_VAULT;

      const { getConfigErrorMessage } = await import('../../src/config/index.js');

      const message = getConfigErrorMessage();
      expect(message).not.toBeNull();
      expect(message).toContain('WithContext is not configured');
      expect(message).toContain('OBSIDIAN_API_KEY');
      expect(message).toContain('OBSIDIAN_VAULT');
      expect(message).toContain('https://github.com/different-ai/with-context-mcp#configuration');
    });
  });

  describe('config proxy (lazy loading)', () => {
    it('should not crash on import when env vars are missing', async () => {
      delete process.env.OBSIDIAN_API_KEY;
      delete process.env.OBSIDIAN_VAULT;

      // This should not throw
      const configModule = await import('../../src/config/index.js');

      // Accessing the config proxy should also not throw
      expect(() => configModule.config).not.toThrow();
    });

    it('should return placeholder values when env vars are missing', async () => {
      delete process.env.OBSIDIAN_API_KEY;
      delete process.env.OBSIDIAN_VAULT;

      const { config } = await import('../../src/config/index.js');

      // Should return placeholder values that indicate config is not set
      expect(config.obsidianApiKey).toBe('NOT_SET');
      expect(config.obsidianVault).toBe('NOT_SET');
    });

    it('should return real values when env vars are present', async () => {
      process.env.OBSIDIAN_API_KEY = 'real-key';
      process.env.OBSIDIAN_VAULT = 'real-vault';

      const { config } = await import('../../src/config/index.js');

      expect(config.obsidianApiKey).toBe('real-key');
      expect(config.obsidianVault).toBe('real-vault');
    });
  });

  describe('getConfig (strict)', () => {
    it('should throw when config is invalid', async () => {
      delete process.env.OBSIDIAN_API_KEY;
      delete process.env.OBSIDIAN_VAULT;

      const { getConfig } = await import('../../src/config/index.js');

      expect(() => getConfig()).toThrow('Configuration invalid');
    });

    it('should return config when valid', async () => {
      process.env.OBSIDIAN_API_KEY = 'test-key';
      process.env.OBSIDIAN_VAULT = 'test-vault';

      const { getConfig } = await import('../../src/config/index.js');

      const config = getConfig();
      expect(config.obsidianApiKey).toBe('test-key');
      expect(config.obsidianVault).toBe('test-vault');
    });
  });
});
