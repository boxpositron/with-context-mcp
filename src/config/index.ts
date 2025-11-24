import { z } from 'zod';
import dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';
import { parseConfigFile, createDefaultConfig, type WithContextConfig } from './config-parser.js';

// Load environment variables
dotenv.config();

/**
 * Configuration schema for the MCP server
 */
const ConfigSchema = z.object({
  // Obsidian REST API settings
  obsidianApiKey: z.string().min(1, 'OBSIDIAN_API_KEY is required'),
  obsidianApiUrl: z
    .string()
    .url('OBSIDIAN_API_URL must be a valid URL')
    .default('https://127.0.0.1:27124'),
  obsidianVault: z.string().min(1, 'OBSIDIAN_VAULT is required'),

  // Project settings
  projectBasePath: z.string().default('Projects'),
  projectFolder: z.string().optional(), // Optional: Set specific project folder

  // Server settings
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  nodeEnv: z.enum(['development', 'production']).default('development'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Configuration state for graceful degradation
 */
export interface ConfigState {
  /** Whether configuration is valid and complete */
  isValid: boolean;
  /** The loaded configuration (may have defaults for missing values) */
  config: Config;
  /** List of missing required fields */
  missingFields: string[];
  /** Validation errors */
  errors: string[];
  /** Whether the plugin can operate (even in degraded mode) */
  canOperate: boolean;
}

// Cached config state
let _configState: ConfigState | null = null;

/**
 * Load and validate configuration from environment variables
 * Throws on validation failure - use for MCP server startup
 */
export function loadConfig(): Config {
  try {
    return ConfigSchema.parse({
      obsidianApiKey: process.env.OBSIDIAN_API_KEY,
      obsidianApiUrl: process.env.OBSIDIAN_API_URL,
      obsidianVault: process.env.OBSIDIAN_VAULT,
      projectBasePath: process.env.PROJECT_BASE_PATH,
      projectFolder: process.env.PROJECT_FOLDER,
      logLevel: process.env.LOG_LEVEL,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    throw new Error('Failed to load configuration');
  }
}

/**
 * Load configuration with graceful degradation - never throws
 * Returns a ConfigState object with validation status
 */
export function loadConfigSafe(): ConfigState {
  if (_configState) {
    return _configState;
  }

  const missingFields: string[] = [];
  const errors: string[] = [];

  // Check required fields
  if (!process.env.OBSIDIAN_API_KEY) {
    missingFields.push('OBSIDIAN_API_KEY');
  }
  if (!process.env.OBSIDIAN_VAULT) {
    missingFields.push('OBSIDIAN_VAULT');
  }

  // Try to parse with defaults for missing values
  const rawConfig = {
    obsidianApiKey: process.env.OBSIDIAN_API_KEY || 'NOT_SET',
    obsidianApiUrl: process.env.OBSIDIAN_API_URL || 'https://127.0.0.1:27124',
    obsidianVault: process.env.OBSIDIAN_VAULT || 'NOT_SET',
    projectBasePath: process.env.PROJECT_BASE_PATH || 'Projects',
    projectFolder: process.env.PROJECT_FOLDER,
    logLevel: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
    nodeEnv: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  };

  // Validate URL if provided
  if (process.env.OBSIDIAN_API_URL) {
    try {
      new URL(process.env.OBSIDIAN_API_URL);
    } catch {
      errors.push('OBSIDIAN_API_URL is not a valid URL');
    }
  }

  const isValid = missingFields.length === 0 && errors.length === 0;

  _configState = {
    isValid,
    config: rawConfig as Config,
    missingFields,
    errors,
    canOperate: isValid, // Can only operate if fully configured
  };

  return _configState;
}

/**
 * Get configuration - returns the config or throws if not valid
 * Use this when you need guaranteed valid config
 */
export function getConfig(): Config {
  const state = loadConfigSafe();
  if (!state.isValid) {
    const issues = [...state.missingFields.map((f) => `Missing: ${f}`), ...state.errors];
    throw new Error(`Configuration invalid: ${issues.join(', ')}`);
  }
  return state.config;
}

/**
 * Check if configuration is valid without throwing
 */
export function isConfigValid(): boolean {
  return loadConfigSafe().isValid;
}

/**
 * Get a user-friendly error message for configuration issues
 */
export function getConfigErrorMessage(): string | null {
  const state = loadConfigSafe();
  if (state.isValid) {
    return null;
  }

  const lines: string[] = ['WithContext is not configured. To enable:'];

  if (state.missingFields.length > 0) {
    lines.push('');
    lines.push('Set these environment variables:');
    for (const field of state.missingFields) {
      switch (field) {
        case 'OBSIDIAN_API_KEY':
          lines.push('  - OBSIDIAN_API_KEY: Get from Obsidian Settings > Local REST API');
          break;
        case 'OBSIDIAN_VAULT':
          lines.push('  - OBSIDIAN_VAULT: Your vault name (e.g., "My Notes")');
          break;
        default:
          lines.push(`  - ${field}`);
      }
    }
  }

  if (state.errors.length > 0) {
    lines.push('');
    lines.push('Fix these issues:');
    for (const error of state.errors) {
      lines.push(`  - ${error}`);
    }
  }

  lines.push('');
  lines.push('See: https://github.com/different-ai/with-context-mcp#configuration');

  return lines.join('\n');
}

/**
 * Load delegation config from project root
 */
export async function loadDelegationConfig(projectRoot: string): Promise<WithContextConfig | null> {
  const configPath = path.join(projectRoot, '.withcontextconfig.jsonc');

  try {
    await fs.access(configPath);
    return parseConfigFile(configPath);
  } catch {
    // Config doesn't exist
    return null;
  }
}

/**
 * Load delegation config synchronously
 */
export function loadDelegationConfigSync(projectRoot: string): WithContextConfig | null {
  const configPath = path.join(projectRoot, '.withcontextconfig.jsonc');

  try {
    return parseConfigFile(configPath);
  } catch {
    // Config doesn't exist or failed to parse
    return null;
  }
}

/**
 * Load delegation config or use defaults
 */
export async function loadDelegationConfigOrDefault(
  projectRoot: string
): Promise<WithContextConfig> {
  const config = await loadDelegationConfig(projectRoot);
  return config ?? createDefaultConfig();
}

/**
 * Lazy-loaded config singleton
 * Uses loadConfigSafe() to prevent crashes during module import when env vars are missing
 * Tools should check isConfigValid() before using config values
 */
export const config: Config = loadConfigSafe().config;

// Export delegation config types and functions
export type { WithContextConfig, DefaultBehavior, ConflictResolution } from './config-parser.js';
export { parseConfigFile, parseConfigString, createDefaultConfig } from './config-parser.js';
