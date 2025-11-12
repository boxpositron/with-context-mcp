/**
 * Health Check Tool
 *
 * Validates the with-context-mcp environment and configuration:
 * - Environment variables
 * - Obsidian API connection
 * - Configuration file validity
 */

import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { config } from '../config/index.js';
import { parseConfigFile } from '../config/config-parser.js';
import { validateConfigSemantic } from '../config/config-validator.js';
import { existsSync } from 'fs';
import { join } from 'path';

export const healthCheckSchema = z.object({});

export type HealthCheckInput = z.infer<typeof healthCheckSchema>;

/**
 * Environment variable check result
 */
interface EnvVarCheck {
  name: string;
  required: boolean;
  present: boolean;
  value?: string;
  masked?: boolean;
}

/**
 * Environment check result
 */
interface EnvironmentCheck {
  status: 'pass' | 'fail';
  required: EnvVarCheck[];
  optional: EnvVarCheck[];
}

/**
 * Obsidian API check result
 */
interface ObsidianApiCheck {
  status: 'pass' | 'fail';
  url: string;
  vaultName: string;
  connected: boolean;
  authenticated: boolean;
  vaultAccessible: boolean;
  latencyMs?: number;
  error?: string;
}

/**
 * Configuration check result
 */
interface ConfigurationCheck {
  status: 'pass' | 'warn' | 'skip';
  configExists: boolean;
  configValid: boolean;
  configPath?: string;
  message?: string;
  errors?: string[];
}

/**
 * Overall health check result
 */
export interface HealthCheckResult {
  success: boolean;
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    environment: EnvironmentCheck;
    obsidianApi: ObsidianApiCheck;
    configuration: ConfigurationCheck;
  };
  summary: string;
  recommendations: string[];
}

/**
 * Check environment variables
 */
function checkEnvironment(): EnvironmentCheck {
  const requiredVars: EnvVarCheck[] = [
    {
      name: 'OBSIDIAN_API_URL',
      required: true,
      present: !!process.env.OBSIDIAN_API_URL,
      value: process.env.OBSIDIAN_API_URL,
    },
    {
      name: 'OBSIDIAN_API_KEY',
      required: true,
      present: !!process.env.OBSIDIAN_API_KEY,
      value: process.env.OBSIDIAN_API_KEY ? '***' : undefined,
      masked: true,
    },
    {
      name: 'OBSIDIAN_VAULT',
      required: true,
      present: !!process.env.OBSIDIAN_VAULT,
      value: process.env.OBSIDIAN_VAULT,
    },
  ];

  const optionalVars: EnvVarCheck[] = [
    {
      name: 'PROJECT_BASE_PATH',
      required: false,
      present: !!process.env.PROJECT_BASE_PATH,
      value: process.env.PROJECT_BASE_PATH || 'Projects (default)',
    },
    {
      name: 'WITH_CONTEXT_AUTO_START',
      required: false,
      present: !!process.env.WITH_CONTEXT_AUTO_START,
      value: process.env.WITH_CONTEXT_AUTO_START || 'true (default)',
    },
    {
      name: 'WITH_CONTEXT_AUTO_TRACK',
      required: false,
      present: !!process.env.WITH_CONTEXT_AUTO_TRACK,
      value: process.env.WITH_CONTEXT_AUTO_TRACK || 'true (default)',
    },
    {
      name: 'WITH_CONTEXT_PROMPT',
      required: false,
      present: !!process.env.WITH_CONTEXT_PROMPT,
      value: process.env.WITH_CONTEXT_PROMPT || 'true (default)',
    },
  ];

  const allRequiredPresent = requiredVars.every((v) => v.present);

  return {
    status: allRequiredPresent ? 'pass' : 'fail',
    required: requiredVars,
    optional: optionalVars,
  };
}

/**
 * Check Obsidian API connection
 */
async function checkObsidianApi(): Promise<ObsidianApiCheck> {
  const result: ObsidianApiCheck = {
    status: 'fail',
    url: config.obsidianApiUrl,
    vaultName: config.obsidianVault,
    connected: false,
    authenticated: false,
    vaultAccessible: false,
  };

  try {
    const client = new ObsidianClient({
      apiUrl: config.obsidianApiUrl,
      apiKey: config.obsidianApiKey,
      vault: config.obsidianVault,
      allowInsecure: true, // Allow self-signed certs for health check
    });

    const healthCheck = await client.testConnection();

    result.connected = healthCheck.connected;
    result.authenticated = healthCheck.authenticated;
    result.vaultAccessible = healthCheck.vaultAccessible;
    result.latencyMs = healthCheck.latencyMs;
    result.error = healthCheck.error;

    if (healthCheck.connected && healthCheck.authenticated && healthCheck.vaultAccessible) {
      result.status = 'pass';
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
  }

  return result;
}

/**
 * Check configuration file
 */
function checkConfiguration(projectFolder?: string): ConfigurationCheck {
  const result: ConfigurationCheck = {
    status: 'skip',
    configExists: false,
    configValid: false,
  };

  // If no project folder specified, skip config check
  if (!projectFolder) {
    result.message = 'No project folder specified, skipping config check';
    return result;
  }

  const configPath = join(projectFolder, '.withcontextconfig.jsonc');
  result.configPath = configPath;
  result.configExists = existsSync(configPath);

  if (!result.configExists) {
    result.status = 'warn';
    result.message = 'Configuration file not found (optional)';
    return result;
  }

  // Validate config
  try {
    const parsedConfig = parseConfigFile(configPath);
    const validation = validateConfigSemantic(parsedConfig);

    if (validation.valid) {
      result.status = 'pass';
      result.configValid = true;
      result.message = 'Configuration is valid';
    } else {
      result.status = 'warn';
      result.configValid = false;
      result.message = 'Configuration has issues';
      result.errors =
        validation.issues
          .filter((issue) => issue.severity === 'error' || issue.severity === 'warning')
          .map((issue) => issue.message) || [];
    }
  } catch (error) {
    result.status = 'warn';
    result.configValid = false;
    result.message = 'Failed to validate configuration';
    result.errors = [error instanceof Error ? error.message : 'Unknown error'];
  }

  return result;
}

/**
 * Generate recommendations based on check results
 */
function generateRecommendations(result: HealthCheckResult): string[] {
  const recommendations: string[] = [];

  // Environment recommendations
  if (result.checks.environment.status === 'fail') {
    const missing = result.checks.environment.required.filter((v) => !v.present);
    for (const v of missing) {
      recommendations.push(`Set ${v.name} in your .env file`);
    }
    recommendations.push('Copy .env.example to .env and fill in the values');
  }

  // API recommendations
  const apiCheck = result.checks.obsidianApi;
  if (apiCheck.status === 'fail') {
    if (!apiCheck.connected) {
      recommendations.push(
        'Start Obsidian and ensure the Local REST API plugin is installed and running'
      );
      recommendations.push(`Verify API URL is correct: ${apiCheck.url}`);
    } else if (!apiCheck.authenticated) {
      recommendations.push('Check your OBSIDIAN_API_KEY is correct');
      recommendations.push(
        'Get the API key from Obsidian: Settings > Community Plugins > Local REST API'
      );
    } else if (!apiCheck.vaultAccessible) {
      recommendations.push(`Check that vault '${apiCheck.vaultName}' exists in Obsidian`);
      recommendations.push('Verify the vault name matches exactly (case-sensitive)');
    }
  }

  // Configuration recommendations
  const configCheck = result.checks.configuration;
  if (configCheck.status === 'warn' && configCheck.configExists && !configCheck.configValid) {
    recommendations.push('Fix configuration errors in .withcontextconfig.jsonc');
    if (configCheck.errors) {
      recommendations.push(...configCheck.errors.map((e) => `  - ${e}`));
    }
  }

  // Performance recommendations
  if (apiCheck.latencyMs && apiCheck.latencyMs > 1000) {
    recommendations.push(
      `API latency is high (${apiCheck.latencyMs}ms). Check network and Obsidian performance.`
    );
  }

  return recommendations;
}

/**
 * Generate summary message
 */
function generateSummary(result: HealthCheckResult): string {
  const { environment, obsidianApi, configuration } = result.checks;

  if (result.status === 'healthy') {
    return 'All checks passed. System is healthy and ready to use.';
  }

  const issues: string[] = [];

  if (environment.status === 'fail') {
    const missing = environment.required.filter((v) => !v.present).length;
    issues.push(`${missing} required environment variable(s) missing`);
  }

  if (obsidianApi.status === 'fail') {
    if (!obsidianApi.connected) {
      issues.push('Cannot connect to Obsidian API');
    } else if (!obsidianApi.authenticated) {
      issues.push('API authentication failed');
    } else if (!obsidianApi.vaultAccessible) {
      issues.push('Vault is not accessible');
    }
  }

  if (configuration.status === 'warn' && configuration.configValid === false) {
    issues.push('Configuration has errors');
  }

  return result.status === 'degraded'
    ? `System is degraded: ${issues.join(', ')}`
    : `System is unhealthy: ${issues.join(', ')}`;
}

/**
 * Perform comprehensive health check
 */
export async function healthCheck(_input: HealthCheckInput): Promise<HealthCheckResult> {
  const project_folder = undefined;

  // Run all checks in parallel for speed
  const [environmentCheck, obsidianApiCheck, configurationCheck] = await Promise.all([
    Promise.resolve(checkEnvironment()),
    checkObsidianApi(),
    Promise.resolve(checkConfiguration(project_folder)),
  ]);

  // Determine overall status
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (environmentCheck.status === 'fail' || obsidianApiCheck.status === 'fail') {
    status = 'unhealthy';
  } else if (configurationCheck.status === 'warn') {
    status = 'degraded';
  }

  const result: HealthCheckResult = {
    success: status !== 'unhealthy',
    status,
    checks: {
      environment: environmentCheck,
      obsidianApi: obsidianApiCheck,
      configuration: configurationCheck,
    },
    summary: '', // Will be set below
    recommendations: [],
  };

  // Generate summary and recommendations
  result.recommendations = generateRecommendations(result);
  result.summary = generateSummary(result);

  return result;
}
