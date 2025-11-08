/**
 * Migrate Config Tool
 * Converts .withcontextignore to .withcontextconfig.jsonc
 */

import { promises as fs } from 'fs';
import path from 'path';
import { generateConfigFromIgnore, parseIgnoreFile } from '../config/legacy-ignore-parser.js';
import { validateConfigSemantic, formatValidationResult } from '../config/config-validator.js';
import { ConfigurationError } from '../types/index.js';

export interface MigrateConfigOptions {
  /**
   * Project root directory
   */
  projectRoot: string;

  /**
   * Create backup of old .withcontextignore file
   */
  createBackup?: boolean;

  /**
   * Keep old .withcontextignore file (don't delete)
   */
  keepOldFile?: boolean;

  /**
   * Dry run - don't write files, just show what would happen
   */
  dryRun?: boolean;

  /**
   * Force overwrite existing .withcontextconfig.jsonc
   */
  force?: boolean;
}

export interface MigrateConfigResult {
  success: boolean;
  message: string;
  oldConfigPath?: string;
  newConfigPath?: string;
  backupPath?: string;
  configPreview?: string;
  validationResult?: string;
  errors?: string[];
}

/**
 * Migrate .withcontextignore to .withcontextconfig.jsonc
 */
export async function migrateConfig(options: MigrateConfigOptions): Promise<MigrateConfigResult> {
  const {
    projectRoot,
    createBackup = true,
    keepOldFile = true,
    dryRun = false,
    force = false,
  } = options;

  const oldConfigPath = path.join(projectRoot, '.withcontextignore');
  const newConfigPath = path.join(projectRoot, '.withcontextconfig.jsonc');
  const backupPath = path.join(projectRoot, '.withcontextignore.backup');

  const errors: string[] = [];

  try {
    // Check if old config exists
    try {
      await fs.access(oldConfigPath);
    } catch {
      return {
        success: false,
        message: 'No .withcontextignore file found to migrate',
        errors: [`File not found: ${oldConfigPath}`],
      };
    }

    // Check if new config already exists
    if (!force) {
      try {
        await fs.access(newConfigPath);
        return {
          success: false,
          message: '.withcontextconfig.jsonc already exists. Use force=true to overwrite.',
          oldConfigPath,
          newConfigPath,
          errors: ['New config file already exists'],
        };
      } catch {
        // New config doesn't exist - good to proceed
      }
    }

    // Read old config
    const ignoreContent = await fs.readFile(oldConfigPath, 'utf-8');

    // Convert to new format
    const newConfig = parseIgnoreFile(oldConfigPath);
    const newConfigContent = generateConfigFromIgnore(ignoreContent);

    // Validate new config
    const validation = validateConfigSemantic(newConfig);
    const validationReport = formatValidationResult(validation);

    if (!validation.valid) {
      errors.push('Generated config has validation errors');
      return {
        success: false,
        message: 'Migration failed: generated config is invalid',
        oldConfigPath,
        newConfigPath,
        configPreview: newConfigContent,
        validationResult: validationReport,
        errors,
      };
    }

    // Dry run - show preview without writing
    if (dryRun) {
      return {
        success: true,
        message: 'Dry run complete. Preview of new config shown below.',
        oldConfigPath,
        newConfigPath,
        backupPath: createBackup ? backupPath : undefined,
        configPreview: newConfigContent,
        validationResult: validationReport,
      };
    }

    // Create backup if requested
    if (createBackup) {
      await fs.copyFile(oldConfigPath, backupPath);
    }

    // Write new config
    await fs.writeFile(newConfigPath, newConfigContent, 'utf-8');

    // Delete old config if requested
    if (!keepOldFile) {
      await fs.unlink(oldConfigPath);
    }

    const messages: string[] = [];
    messages.push('Migration successful!');
    messages.push(`Created: ${newConfigPath}`);
    if (createBackup) {
      messages.push(`Backup: ${backupPath}`);
    }
    if (!keepOldFile) {
      messages.push(`Deleted: ${oldConfigPath}`);
    } else {
      messages.push(`Kept old file: ${oldConfigPath}`);
    }

    return {
      success: true,
      message: messages.join('\n'),
      oldConfigPath,
      newConfigPath,
      backupPath: createBackup ? backupPath : undefined,
      validationResult: validationReport,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
    return {
      success: false,
      message: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      oldConfigPath,
      newConfigPath,
      errors,
    };
  }
}

/**
 * Check if project needs migration
 */
export async function needsMigration(projectRoot: string): Promise<boolean> {
  const oldConfigPath = path.join(projectRoot, '.withcontextignore');
  const newConfigPath = path.join(projectRoot, '.withcontextconfig.jsonc');

  try {
    // Check if old config exists
    await fs.access(oldConfigPath);

    // Check if new config doesn't exist
    try {
      await fs.access(newConfigPath);
      return false; // New config exists, no migration needed
    } catch {
      return true; // Old exists, new doesn't - needs migration
    }
  } catch {
    return false; // Old config doesn't exist - no migration needed
  }
}

/**
 * Auto-migrate if needed (for backwards compatibility)
 * Returns path to config file (old or new)
 */
export async function autoMigrateIfNeeded(
  projectRoot: string,
  options?: { dryRun?: boolean }
): Promise<{ configPath: string; migrated: boolean; result?: MigrateConfigResult }> {
  const newConfigPath = path.join(projectRoot, '.withcontextconfig.jsonc');
  const oldConfigPath = path.join(projectRoot, '.withcontextignore');

  // Check if new config exists
  try {
    await fs.access(newConfigPath);
    return { configPath: newConfigPath, migrated: false };
  } catch {
    // New config doesn't exist
  }

  // Check if old config exists
  try {
    await fs.access(oldConfigPath);

    // Auto-migrate
    if (!options?.dryRun) {
      const result = await migrateConfig({
        projectRoot,
        createBackup: true,
        keepOldFile: true,
        dryRun: false,
        force: false,
      });

      if (result.success) {
        return { configPath: newConfigPath, migrated: true, result };
      } else {
        // Migration failed, fall back to old config
        return { configPath: oldConfigPath, migrated: false, result };
      }
    }

    return { configPath: oldConfigPath, migrated: false };
  } catch {
    // Neither config exists
    throw new ConfigurationError(
      'No configuration file found. Create .withcontextconfig.jsonc or .withcontextignore'
    );
  }
}
