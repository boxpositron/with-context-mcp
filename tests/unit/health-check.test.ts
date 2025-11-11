import { describe, it, expect, beforeEach, vi } from 'vitest';
import { healthCheck } from '../../src/tools/health-check.js';
import { ObsidianClient } from '../../src/obsidian/client.js';
import * as configParser from '../../src/config/config-parser.js';
import * as fs from 'fs';

// Mock modules
vi.mock('../../src/obsidian/client.js');
vi.mock('fs');

describe('Health Check Tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default environment variables
    process.env.OBSIDIAN_API_URL = 'https://127.0.0.1:27124';
    process.env.OBSIDIAN_API_KEY = 'test-api-key';
    process.env.OBSIDIAN_VAULT = 'TestVault';
    process.env.PROJECT_BASE_PATH = 'Projects';
  });

  describe('Environment Checks', () => {
    it('should pass when all required env vars are present', async () => {
      // Mock successful API connection
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const result = await healthCheck({});

      expect(result.checks.environment.status).toBe('pass');
      expect(result.checks.environment.required).toHaveLength(3);
      expect(result.checks.environment.required.every((v) => v.present)).toBe(true);
    });

    it('should fail when OBSIDIAN_API_URL is missing', async () => {
      delete process.env.OBSIDIAN_API_URL;

      const result = await healthCheck({});

      expect(result.checks.environment.status).toBe('fail');
      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain('Set OBSIDIAN_API_URL in your .env file');
    });

    it('should fail when OBSIDIAN_API_KEY is missing', async () => {
      delete process.env.OBSIDIAN_API_KEY;

      const result = await healthCheck({});

      expect(result.checks.environment.status).toBe('fail');
      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain('Set OBSIDIAN_API_KEY in your .env file');
    });

    it('should fail when OBSIDIAN_VAULT is missing', async () => {
      delete process.env.OBSIDIAN_VAULT;

      const result = await healthCheck({});

      expect(result.checks.environment.status).toBe('fail');
      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain('Set OBSIDIAN_VAULT in your .env file');
    });

    it('should show optional env vars with defaults', async () => {
      // Mock successful API connection
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const result = await healthCheck({});

      expect(result.checks.environment.optional).toHaveLength(4);
      const projectBasePath = result.checks.environment.optional.find(
        (v) => v.name === 'PROJECT_BASE_PATH'
      );
      expect(projectBasePath?.value).toBe('Projects');
    });

    it('should mask API key in results', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const result = await healthCheck({});

      const apiKeyVar = result.checks.environment.required.find(
        (v) => v.name === 'OBSIDIAN_API_KEY'
      );
      expect(apiKeyVar?.value).toBe('***');
      expect(apiKeyVar?.masked).toBe(true);
    });
  });

  describe('Obsidian API Checks', () => {
    it('should pass when API is fully accessible', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const result = await healthCheck({});

      expect(result.checks.obsidianApi.status).toBe('pass');
      expect(result.checks.obsidianApi.connected).toBe(true);
      expect(result.checks.obsidianApi.authenticated).toBe(true);
      expect(result.checks.obsidianApi.vaultAccessible).toBe(true);
      expect(result.checks.obsidianApi.latencyMs).toBe(100);
      expect(result.status).toBe('healthy');
    });

    it('should fail when API cannot connect', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: false,
        authenticated: false,
        vaultAccessible: false,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        error: 'Cannot connect to Obsidian API',
      });

      const result = await healthCheck({});

      expect(result.checks.obsidianApi.status).toBe('fail');
      expect(result.checks.obsidianApi.connected).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain(
        'Start Obsidian and ensure the Local REST API plugin is installed and running'
      );
    });

    it('should fail when authentication fails', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: false,
        vaultAccessible: false,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        error: 'Invalid API key',
      });

      const result = await healthCheck({});

      expect(result.checks.obsidianApi.status).toBe('fail');
      expect(result.checks.obsidianApi.connected).toBe(true);
      expect(result.checks.obsidianApi.authenticated).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain('Check your OBSIDIAN_API_KEY is correct');
    });

    it('should fail when vault is not accessible', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: false,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        error: 'Vault not found',
      });

      const result = await healthCheck({});

      expect(result.checks.obsidianApi.status).toBe('fail');
      expect(result.checks.obsidianApi.connected).toBe(true);
      expect(result.checks.obsidianApi.authenticated).toBe(true);
      expect(result.checks.obsidianApi.vaultAccessible).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.recommendations).toContain("Check that vault 'TestVault' exists in Obsidian");
    });

    it('should warn about high latency', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 1500,
      });

      const result = await healthCheck({});

      expect(result.checks.obsidianApi.status).toBe('pass');
      expect(result.recommendations).toContain(
        'API latency is high (1500ms). Check network and Obsidian performance.'
      );
    });

    it('should handle API errors gracefully', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockRejectedValue(
        new Error('Network error')
      );

      const result = await healthCheck({});

      expect(result.checks.obsidianApi.status).toBe('fail');
      expect(result.checks.obsidianApi.error).toBe('Network error');
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('Configuration Checks', () => {
    it('should skip check when no project folder is provided', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const result = await healthCheck({});

      expect(result.checks.configuration.status).toBe('skip');
      expect(result.checks.configuration.configExists).toBe(false);
      expect(result.checks.configuration.message).toBe(
        'No project folder specified, skipping config check'
      );
    });

    it('should warn when config file does not exist', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await healthCheck({ project_folder: '/test/project' });

      expect(result.checks.configuration.status).toBe('warn');
      expect(result.checks.configuration.configExists).toBe(false);
      expect(result.checks.configuration.message).toBe('Configuration file not found (optional)');
      expect(result.status).toBe('degraded');
    });

    it('should pass when config is valid', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.spyOn(configParser, 'parseConfigFile').mockReturnValue({
        version: '2.1',
        defaultBehavior: 'local',
        vault: [],
        local: [],
        conflictResolution: 'local-wins',
      });

      const result = await healthCheck({ project_folder: '/test/project' });

      expect(result.checks.configuration.status).toBe('pass');
      expect(result.checks.configuration.configExists).toBe(true);
      expect(result.checks.configuration.configValid).toBe(true);
      expect(result.checks.configuration.message).toBe('Configuration is valid');
      expect(result.status).toBe('healthy');
    });

    it('should pass when config has warnings but is valid', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.spyOn(configParser, 'parseConfigFile').mockReturnValue({
        version: '2.1',
        defaultBehavior: 'local',
        vault: ['**'],
        local: ['**'],
        conflictResolution: 'local-wins',
      });

      const result = await healthCheck({ project_folder: '/test/project' });

      // Config with warnings is still valid
      expect(result.checks.configuration.status).toBe('pass');
      expect(result.checks.configuration.configValid).toBe(true);
      expect(result.status).toBe('healthy');
    });

    it('should warn when config parsing fails', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.spyOn(configParser, 'parseConfigFile').mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const result = await healthCheck({ project_folder: '/test/project' });

      expect(result.checks.configuration.status).toBe('warn');
      expect(result.checks.configuration.configValid).toBe(false);
      expect(result.checks.configuration.message).toBe('Failed to validate configuration');
      expect(result.checks.configuration.errors).toContain('Invalid JSON');
      expect(result.status).toBe('degraded');
    });
  });

  describe('Overall Status', () => {
    it('should be healthy when all checks pass', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const result = await healthCheck({});

      expect(result.success).toBe(true);
      expect(result.status).toBe('healthy');
      expect(result.summary).toBe('All checks passed. System is healthy and ready to use.');
    });

    it('should be unhealthy when env vars are missing', async () => {
      delete process.env.OBSIDIAN_API_URL;

      const result = await healthCheck({});

      expect(result.success).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.summary).toContain('required environment variable(s) missing');
    });

    it('should be unhealthy when API connection fails', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: false,
        authenticated: false,
        vaultAccessible: false,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        error: 'Connection refused',
      });

      const result = await healthCheck({});

      expect(result.success).toBe(false);
      expect(result.status).toBe('unhealthy');
      expect(result.summary).toContain('Cannot connect to Obsidian API');
    });

    it('should be degraded when config has issues', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await healthCheck({ project_folder: '/test/project' });

      expect(result.success).toBe(true);
      expect(result.status).toBe('degraded');
    });

    it('should provide actionable recommendations', async () => {
      delete process.env.OBSIDIAN_API_URL;
      delete process.env.OBSIDIAN_API_KEY;

      const result = await healthCheck({});

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Set OBSIDIAN_API_URL in your .env file');
      expect(result.recommendations).toContain('Set OBSIDIAN_API_KEY in your .env file');
      expect(result.recommendations).toContain('Copy .env.example to .env and fill in the values');
    });
  });

  describe('Performance', () => {
    it('should complete quickly', async () => {
      vi.mocked(ObsidianClient.prototype.testConnection).mockResolvedValue({
        connected: true,
        authenticated: true,
        vaultAccessible: true,
        vaultName: 'TestVault',
        apiUrl: 'https://127.0.0.1:27124',
        latencyMs: 100,
      });

      const startTime = Date.now();
      await healthCheck({});
      const duration = Date.now() - startTime;

      // Should complete in less than 2 seconds (as per requirements)
      expect(duration).toBeLessThan(2000);
    });
  });
});
