/**
 * Validate Config Tool
 * Validates .withcontextconfig.jsonc for errors and provides helpful feedback
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseConfigFile } from '../config/config-parser.js';
import { validateConfigSemantic, formatValidationResult } from '../config/config-validator.js';
import { ConfigurationError } from '../types/index.js';

export interface ValidateConfigOptions {
  /**
   * Project root directory
   */
  projectRoot: string;

  /**
   * Config file path (relative to projectRoot or absolute)
   * Defaults to .withcontextconfig.jsonc
   */
  configPath?: string;
}

export interface ValidateConfigResult {
  valid: boolean;
  message: string;
  configPath: string;
  errors: string[];
  warnings: string[];
  infos: string[];
  formattedReport: string;
}

/**
 * Validate configuration file
 */
export async function validateConfig(
  options: ValidateConfigOptions
): Promise<ValidateConfigResult> {
  const { projectRoot, configPath } = options;

  const resolvedConfigPath = configPath
    ? path.isAbsolute(configPath)
      ? configPath
      : path.join(projectRoot, configPath)
    : path.join(projectRoot, '.withcontextconfig.jsonc');

  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  try {
    // Check if config file exists
    try {
      await fs.access(resolvedConfigPath);
    } catch {
      return {
        valid: false,
        message: `Configuration file not found: ${resolvedConfigPath}`,
        configPath: resolvedConfigPath,
        errors: ['File not found'],
        warnings: [],
        infos: [],
        formattedReport: `[X] Configuration file not found: ${resolvedConfigPath}`,
      };
    }

    // Parse config (will throw on syntax/structural errors)
    let config;
    try {
      config = parseConfigFile(resolvedConfigPath);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(errorMsg);
      return {
        valid: false,
        message: 'Configuration has syntax or structural errors',
        configPath: resolvedConfigPath,
        errors,
        warnings: [],
        infos: [],
        formattedReport: `[X] Configuration has errors:\n\n${errorMsg}`,
      };
    }

    // Validate semantic issues
    const validation = validateConfigSemantic(config);
    const formattedReport = formatValidationResult(validation);

    // Categorize issues
    validation.issues.forEach((issue) => {
      if (issue.severity === 'error') {
        errors.push(issue.message);
      } else if (issue.severity === 'warning') {
        warnings.push(issue.message);
      } else if (issue.severity === 'info') {
        infos.push(issue.message);
      }
    });

    return {
      valid: validation.valid,
      message: validation.valid ? 'Configuration is valid' : 'Configuration has validation errors',
      configPath: resolvedConfigPath,
      errors,
      warnings,
      infos,
      formattedReport,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(errorMsg);
    return {
      valid: false,
      message: `Validation failed: ${errorMsg}`,
      configPath: resolvedConfigPath,
      errors,
      warnings: [],
      infos: [],
      formattedReport: `[X] Validation failed:\n\n${errorMsg}`,
    };
  }
}

/**
 * Validate configuration and throw if invalid
 */
export async function validateConfigOrThrow(options: ValidateConfigOptions): Promise<void> {
  const result = await validateConfig(options);

  if (!result.valid) {
    throw new ConfigurationError(`Configuration validation failed:\n${result.formattedReport}`);
  }

  // Log warnings/infos if present
  if (result.warnings.length > 0 || result.infos.length > 0) {
    console.warn(`Configuration validation notes:\n${result.formattedReport}`);
  }
}
