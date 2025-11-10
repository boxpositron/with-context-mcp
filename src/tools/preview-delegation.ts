/**
 * Preview Delegation Tool
 * Shows which files will be delegated to vault vs kept local
 * Useful for testing configuration patterns before applying
 */

import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import { parseConfigFile } from '../config/config-parser.js';
import {
  decideDelegationWithReasoning,
  type DelegationReasoning,
} from '../doc-delegator/delegation-decision.js';
import { ConfigurationError } from '../types/index.js';

export interface PreviewDelegationOptions {
  /**
   * Project root directory
   */
  projectRoot: string;

  /**
   * Config file path (defaults to .withcontextconfig.jsonc)
   */
  configPath?: string;

  /**
   * File patterns to preview (defaults to **\/*.md)
   */
  filePatterns?: string[];

  /**
   * Maximum number of files to show per category
   */
  limit?: number;

  /**
   * Show detailed reasoning for each file
   */
  showReasoning?: boolean;

  /**
   * Filter to show only files going to vault
   */
  vaultOnly?: boolean;

  /**
   * Filter to show only files staying local
   */
  localOnly?: boolean;
}

export interface PreviewDelegationResult {
  success: boolean;
  message: string;
  configPath: string;
  totalFiles: number;
  vaultFiles: string[];
  localFiles: string[];
  reasoning?: Map<string, DelegationReasoning>;
  summary: {
    vault: number;
    local: number;
  };
  formattedPreview: string;
}

/**
 * Preview delegation decisions for files in project
 */
export async function previewDelegation(
  options: PreviewDelegationOptions
): Promise<PreviewDelegationResult> {
  const {
    projectRoot,
    configPath,
    filePatterns = ['**/*.md'],
    limit = 100,
    showReasoning = false,
    vaultOnly = false,
    localOnly = false,
  } = options;

  const resolvedConfigPath = configPath
    ? path.isAbsolute(configPath)
      ? configPath
      : path.join(projectRoot, configPath)
    : path.join(projectRoot, '.withcontextconfig.jsonc');

  try {
    // Check if config file exists
    try {
      await fs.access(resolvedConfigPath);
    } catch {
      throw new ConfigurationError(`Configuration file not found: ${resolvedConfigPath}`);
    }

    // Parse config
    const config = parseConfigFile(resolvedConfigPath);

    // Find files matching patterns
    const allFiles: string[] = [];
    for (const pattern of filePatterns) {
      const matches = await glob(pattern, {
        cwd: projectRoot,
        nodir: true,
        dot: true,
        ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
      });
      allFiles.push(...matches);
    }

    // Remove duplicates
    const uniqueFiles = [...new Set(allFiles)];

    // Decide delegation for each file
    const vaultFiles: string[] = [];
    const localFiles: string[] = [];
    const reasoning = new Map<string, DelegationReasoning>();

    for (const file of uniqueFiles) {
      const decision = decideDelegationWithReasoning(file, config);
      reasoning.set(file, decision);

      if (decision.decision === 'vault') {
        vaultFiles.push(file);
      } else {
        localFiles.push(file);
      }
    }

    // Apply filters
    let displayVaultFiles = vaultFiles;
    let displayLocalFiles = localFiles;

    if (vaultOnly) {
      displayLocalFiles = [];
    }

    if (localOnly) {
      displayVaultFiles = [];
    }

    // Apply limit
    const limitedVaultFiles = displayVaultFiles.slice(0, limit);
    const limitedLocalFiles = displayLocalFiles.slice(0, limit);

    // Format preview
    const lines: string[] = [];
    lines.push('='.repeat(80));
    lines.push('DELEGATION PREVIEW');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push(`Configuration: ${resolvedConfigPath}`);
    lines.push(`Total files: ${uniqueFiles.length}`);
    lines.push(`  • Vault: ${vaultFiles.length}`);
    lines.push(`  • Local: ${localFiles.length}`);
    lines.push('');

    if (!localOnly && displayVaultFiles.length > 0) {
      lines.push('-'.repeat(80));
      lines.push(
        `FILES TO DELEGATE TO VAULT (${vaultFiles.length} total, showing ${limitedVaultFiles.length})`
      );
      lines.push('-'.repeat(80));
      lines.push('');

      for (const file of limitedVaultFiles) {
        lines.push(`  → ${file}`);
        if (showReasoning) {
          const r = reasoning.get(file);
          if (r) {
            lines.push(`     Reason: ${r.reason}`);
          }
        }
      }

      if (vaultFiles.length > limit) {
        lines.push('');
        lines.push(`  ... and ${vaultFiles.length - limit} more files`);
      }

      lines.push('');
    }

    if (!vaultOnly && displayLocalFiles.length > 0) {
      lines.push('-'.repeat(80));
      lines.push(
        `FILES TO KEEP LOCAL (${localFiles.length} total, showing ${limitedLocalFiles.length})`
      );
      lines.push('-'.repeat(80));
      lines.push('');

      for (const file of limitedLocalFiles) {
        lines.push(`  [OK] ${file}`);
        if (showReasoning) {
          const r = reasoning.get(file);
          if (r) {
            lines.push(`     Reason: ${r.reason}`);
          }
        }
      }

      if (localFiles.length > limit) {
        lines.push('');
        lines.push(`  ... and ${localFiles.length - limit} more files`);
      }

      lines.push('');
    }

    lines.push('='.repeat(80));

    return {
      success: true,
      message: 'Preview generated successfully',
      configPath: resolvedConfigPath,
      totalFiles: uniqueFiles.length,
      vaultFiles,
      localFiles,
      reasoning: showReasoning ? reasoning : undefined,
      summary: {
        vault: vaultFiles.length,
        local: localFiles.length,
      },
      formattedPreview: lines.join('\n'),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new ConfigurationError(`Preview failed: ${errorMsg}`);
  }
}

/**
 * Preview delegation for a specific list of files (not using glob)
 */
export async function previewDelegationForFiles(
  projectRoot: string,
  filePaths: string[],
  configPath?: string,
  showReasoning = true
): Promise<PreviewDelegationResult> {
  const resolvedConfigPath = configPath
    ? path.isAbsolute(configPath)
      ? configPath
      : path.join(projectRoot, configPath)
    : path.join(projectRoot, '.withcontextconfig.jsonc');

  try {
    // Parse config
    const config = parseConfigFile(resolvedConfigPath);

    // Decide delegation for each file
    const vaultFiles: string[] = [];
    const localFiles: string[] = [];
    const reasoning = new Map<string, DelegationReasoning>();

    for (const file of filePaths) {
      const relativePath = path.isAbsolute(file) ? path.relative(projectRoot, file) : file;
      const decision = decideDelegationWithReasoning(relativePath, config);
      reasoning.set(relativePath, decision);

      if (decision.decision === 'vault') {
        vaultFiles.push(relativePath);
      } else {
        localFiles.push(relativePath);
      }
    }

    // Format preview
    const lines: string[] = [];
    lines.push('DELEGATION PREVIEW FOR SPECIFIC FILES');
    lines.push('='.repeat(80));
    lines.push('');

    for (const file of filePaths) {
      const relativePath = path.isAbsolute(file) ? path.relative(projectRoot, file) : file;
      const r = reasoning.get(relativePath);
      if (!r) continue;

      const symbol = r.decision === 'vault' ? '->' : '[OK]';
      const destination = r.decision === 'vault' ? 'VAULT' : 'LOCAL';

      lines.push(`${symbol} ${relativePath} → ${destination}`);
      if (showReasoning) {
        lines.push(`  Reason: ${r.reason}`);
      }
      lines.push('');
    }

    lines.push('='.repeat(80));
    lines.push(`Summary: ${vaultFiles.length} vault, ${localFiles.length} local`);

    return {
      success: true,
      message: 'Preview generated successfully',
      configPath: resolvedConfigPath,
      totalFiles: filePaths.length,
      vaultFiles,
      localFiles,
      reasoning: showReasoning ? reasoning : undefined,
      summary: {
        vault: vaultFiles.length,
        local: localFiles.length,
      },
      formattedPreview: lines.join('\n'),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new ConfigurationError(`Preview failed: ${errorMsg}`);
  }
}
