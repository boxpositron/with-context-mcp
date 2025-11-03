/**
 * CLI Commands for Documentation Delegation Management
 * Provides commands for managing .withcontextignore patterns and delegation features
 */

import { promises as fs } from 'fs';
import path from 'path';
import { IgnoreConfig } from './ignore-config.js';
import { VaultCache } from './vault-cache.js';
import { DOC_EXTENSIONS, DEFAULT_IGNORE_FILE } from './constants.js';

/**
 * CLI command result
 */
export interface CLIResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * DelegationCLI class
 * Provides CLI commands for managing documentation delegation
 */
export class DelegationCLI {
  private projectRoot: string;
  private ignoreConfig?: IgnoreConfig;

  /**
   * Create a new DelegationCLI instance
   * @param projectRoot - Project root directory
   */
  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Format a section header
   * @param title - Section title
   * @returns Formatted header
   */
  private formatHeader(title: string): string {
    const line = '='.repeat(Math.min(title.length + 4, 80));
    return `\n${line}\n  ${title}\n${line}\n`;
  }

  /**
   * Format a subsection header
   * @param title - Subsection title
   * @returns Formatted header
   */
  private formatSubHeader(title: string): string {
    return `\n${title}\n${'-'.repeat(Math.min(title.length, 80))}\n`;
  }

  /**
   * Format a list item
   * @param text - Item text
   * @param indent - Indentation level (default: 0)
   * @returns Formatted list item
   */
  private formatListItem(text: string, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    return `${spaces}* ${text}`;
  }

  /**
   * Format a key-value pair
   * @param key - Key text
   * @param value - Value text
   * @param indent - Indentation level (default: 0)
   * @returns Formatted key-value pair
   */
  private formatKeyValue(key: string, value: string | number, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    return `${spaces}${key}: ${value}`;
  }

  /**
   * Format an info message
   * @param message - Message text
   * @returns Formatted info message
   */
  private formatInfo(message: string): string {
    return `[INFO] ${message}`;
  }

  /**
   * Format a success message
   * @param message - Message text
   * @returns Formatted success message
   */
  private formatSuccess(message: string): string {
    return `[SUCCESS] ${message}`;
  }

  /**
   * Format an error message
   * @param message - Message text
   * @returns Formatted error message
   */
  private formatError(message: string): string {
    return `[ERROR] ${message}`;
  }

  /**
   * Format a warning message
   * @param message - Message text
   * @returns Formatted warning message
   */
  private formatWarning(message: string): string {
    return `[WARNING] ${message}`;
  }

  /**
   * Create .withcontextignore file from template
   * @returns CLI result
   */
  async createWithContextIgnore(): Promise<CLIResult> {
    try {
      const ignoreFilePath = path.join(this.projectRoot, DEFAULT_IGNORE_FILE);
      const templatePath = path.join(this.projectRoot, '.withcontextignore.template');

      // Check if file already exists
      try {
        await fs.access(ignoreFilePath);
        return {
          success: false,
          output: '',
          error: this.formatError(`.withcontextignore already exists at: ${ignoreFilePath}`),
        };
      } catch {
        // File doesn't exist, proceed with creation
      }

      // Read template
      let templateContent: string;
      try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
      } catch {
        // Template not found, use minimal default
        templateContent = `# .withcontextignore
#
# This file controls which documentation files are delegated to your Obsidian vault
# via the with-context MCP server.
#
# Syntax:
#   - One pattern per line
#   - Lines starting with # are comments
#   - Use ! to negate a pattern
#   - Patterns use glob syntax (*, **, ?, [abc], etc.)
#
# Examples:
#   docs/internal/     # Ignore entire directory
#   !README.md         # Include README.md (negation)
#   **/private/**      # Ignore any private subdirectory

# Add your patterns below:

`;
      }

      // Write file
      await fs.writeFile(ignoreFilePath, templateContent, 'utf-8');

      const output = [
        this.formatSuccess(`Created .withcontextignore file`),
        '',
        this.formatKeyValue('Location', ignoreFilePath),
        '',
        this.formatInfo(
          'Edit this file to configure which documentation files should be delegated to your vault.'
        ),
        this.formatInfo('Run --delegation-report to see which files will be affected.'),
      ].join('\n');

      return { success: true, output };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        output: '',
        error: this.formatError(`Failed to create .withcontextignore: ${err.message}`),
      };
    }
  }

  /**
   * Check if a specific file would be delegated
   * @param filePath - Absolute or relative file path to check
   * @returns CLI result
   */
  async checkDelegation(filePath: string): Promise<CLIResult> {
    try {
      // Initialize ignore config if needed
      if (!this.ignoreConfig) {
        this.ignoreConfig = IgnoreConfig.getInstance(this.projectRoot);
        await this.ignoreConfig.loadIgnoreFile();
      }

      // Resolve file path
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(this.projectRoot, filePath);

      // Get relative path
      const relativePath = path.relative(this.projectRoot, absolutePath);

      // Check if it's a doc file
      const ext = path.extname(absolutePath);
      const isDocFile = DOC_EXTENSIONS.includes(ext.toLowerCase());

      // Check ignore patterns
      const matcher = await this.ignoreConfig.getMatcher();
      const matchesIgnorePattern = matcher.isIgnored(relativePath);

      // Determine delegation status
      const shouldDelegate = isDocFile && matchesIgnorePattern;

      // Format output
      const output = [
        this.formatHeader('Delegation Check'),
        '',
        this.formatKeyValue('File', relativePath),
        this.formatKeyValue('Is documentation file', isDocFile ? 'Yes' : 'No'),
        this.formatKeyValue('Matches ignore patterns', matchesIgnorePattern ? 'Yes' : 'No'),
        this.formatKeyValue('Will be delegated', shouldDelegate ? 'Yes' : 'No'),
        '',
      ];

      if (!isDocFile) {
        output.push(
          this.formatInfo('File is not a documentation file (not .md, .txt, .rst, or .adoc)')
        );
      } else if (!matchesIgnorePattern) {
        output.push(this.formatInfo('File does not match any patterns in .withcontextignore'));
      } else {
        output.push(this.formatSuccess('File will be delegated to vault'));
      }

      return { success: true, output: output.join('\n') };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        output: '',
        error: this.formatError(`Failed to check delegation: ${err.message}`),
      };
    }
  }

  /**
   * Generate delegation report for all documentation files
   * @returns CLI result
   */
  async delegationReport(): Promise<CLIResult> {
    try {
      // Initialize ignore config if needed
      if (!this.ignoreConfig) {
        this.ignoreConfig = IgnoreConfig.getInstance(this.projectRoot);
        await this.ignoreConfig.loadIgnoreFile();
      }

      const matcher = await this.ignoreConfig.getMatcher();
      const hasIgnoreFile = this.ignoreConfig.hasIgnoreFile();

      // Scan for doc files
      const docFiles = await this.findDocFiles(this.projectRoot);

      // Categorize files
      const delegatedFiles: string[] = [];
      const localFiles: string[] = [];

      for (const filePath of docFiles) {
        const relativePath = path.relative(this.projectRoot, filePath);
        const matchesIgnorePattern = matcher.isIgnored(relativePath);

        if (matchesIgnorePattern) {
          delegatedFiles.push(relativePath);
        } else {
          localFiles.push(relativePath);
        }
      }

      // Get pattern info
      const patterns = matcher.getPatterns();

      // Format output
      const output = [
        this.formatHeader('Delegation Report'),
        '',
        this.formatKeyValue('Project root', this.projectRoot),
        this.formatKeyValue('.withcontextignore file', hasIgnoreFile ? 'Found' : 'Not found'),
        this.formatKeyValue('Total doc files found', docFiles.length),
        this.formatKeyValue('Files to be delegated', delegatedFiles.length),
        this.formatKeyValue('Files kept local', localFiles.length),
        '',
      ];

      // Show patterns
      output.push(this.formatSubHeader('Ignore Patterns'));
      if (patterns.ignore.length === 0) {
        output.push(this.formatInfo('No ignore patterns configured'));
      } else {
        output.push(this.formatInfo(`${patterns.ignore.length} pattern(s) configured:`));
        patterns.ignore.slice(0, 10).forEach((pattern) => {
          output.push(this.formatListItem(pattern, 1));
        });
        if (patterns.ignore.length > 10) {
          output.push(this.formatListItem(`... and ${patterns.ignore.length - 10} more`, 1));
        }
      }
      output.push('');

      // Show negation patterns
      if (patterns.include.length > 0) {
        output.push(this.formatSubHeader('Include Patterns (Negations)'));
        output.push(this.formatInfo(`${patterns.include.length} pattern(s) configured:`));
        patterns.include.forEach((pattern) => {
          output.push(this.formatListItem(`!${pattern}`, 1));
        });
        output.push('');
      }

      // Show delegated files
      output.push(this.formatSubHeader('Files to be Delegated to Vault'));
      if (delegatedFiles.length === 0) {
        output.push(this.formatInfo('No files will be delegated'));
      } else {
        delegatedFiles.slice(0, 20).forEach((file) => {
          output.push(this.formatListItem(file, 1));
        });
        if (delegatedFiles.length > 20) {
          output.push(this.formatListItem(`... and ${delegatedFiles.length - 20} more`, 1));
        }
      }
      output.push('');

      // Show local files
      output.push(this.formatSubHeader('Files Kept Local'));
      if (localFiles.length === 0) {
        output.push(this.formatInfo('No files will be kept local'));
      } else {
        localFiles.slice(0, 20).forEach((file) => {
          output.push(this.formatListItem(file, 1));
        });
        if (localFiles.length > 20) {
          output.push(this.formatListItem(`... and ${localFiles.length - 20} more`, 1));
        }
      }
      output.push('');

      // Show summary
      if (!hasIgnoreFile) {
        output.push(
          this.formatWarning(
            'No .withcontextignore file found. Run --create-withcontextignore to create one.'
          )
        );
      }

      return { success: true, output: output.join('\n') };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        output: '',
        error: this.formatError(`Failed to generate delegation report: ${err.message}`),
      };
    }
  }

  /**
   * Show cache statistics
   * @param cache - VaultCache instance (optional)
   * @returns CLI result
   */
  async cacheStats(cache?: VaultCache): Promise<CLIResult> {
    try {
      if (!cache) {
        return {
          success: false,
          output: '',
          error: this.formatError('Cache is not enabled'),
        };
      }

      const stats = cache.getExtendedStats();

      // Format output
      const output = [
        this.formatHeader('Cache Statistics'),
        '',
        this.formatSubHeader('Cache Size'),
        this.formatKeyValue('Total entries', stats.size, 1),
        this.formatKeyValue('Valid entries', stats.validEntries, 1),
        this.formatKeyValue('Max entries', cache.getMaxEntries(), 1),
        '',
        this.formatSubHeader('Performance'),
        this.formatKeyValue('Total hits', stats.totalHits, 1),
        this.formatKeyValue('Total misses', stats.totalMisses, 1),
        this.formatKeyValue('Hit rate', `${(stats.hitRate * 100).toFixed(2)}%`, 1),
        this.formatKeyValue('Avg hits per entry', stats.avgHitsPerEntry.toFixed(2), 1),
        '',
        this.formatSubHeader('Eviction'),
        this.formatKeyValue('Total evictions', stats.totalEvictions, 1),
        '',
        this.formatSubHeader('Configuration'),
        this.formatKeyValue('TTL', `${cache.getTTL() / 1000}s`, 1),
        '',
      ];

      if (stats.validEntries === 0) {
        output.push(this.formatInfo('Cache is empty'));
      }

      return { success: true, output: output.join('\n') };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        output: '',
        error: this.formatError(`Failed to get cache stats: ${err.message}`),
      };
    }
  }

  /**
   * Clear cache
   * @param cache - VaultCache instance (optional)
   * @returns CLI result
   */
  async cacheClear(cache?: VaultCache): Promise<CLIResult> {
    try {
      if (!cache) {
        return {
          success: false,
          output: '',
          error: this.formatError('Cache is not enabled'),
        };
      }

      const sizeBeforeClear = cache.size();
      cache.clear();

      const output = [
        this.formatSuccess('Cache cleared'),
        '',
        this.formatKeyValue('Entries removed', sizeBeforeClear),
        '',
      ].join('\n');

      return { success: true, output };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        output: '',
        error: this.formatError(`Failed to clear cache: ${err.message}`),
      };
    }
  }

  /**
   * Recursively find all documentation files in a directory
   * @param dirPath - Directory to search
   * @param maxDepth - Maximum recursion depth (default: 10)
   * @param currentDepth - Current recursion depth (default: 0)
   * @returns Array of absolute file paths
   */
  private async findDocFiles(
    dirPath: string,
    maxDepth: number = 10,
    currentDepth: number = 0
  ): Promise<string[]> {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const results: string[] = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        // Skip common directories that should be ignored
        if (entry.isDirectory()) {
          const skipDirs = [
            'node_modules',
            '.git',
            '.next',
            '.docusaurus',
            'dist',
            'build',
            'out',
            'coverage',
            '.turbo',
          ];

          if (skipDirs.includes(entry.name)) {
            continue;
          }

          // Recursively search subdirectories
          const subResults = await this.findDocFiles(fullPath, maxDepth, currentDepth + 1);
          results.push(...subResults);
        } else if (entry.isFile()) {
          // Check if it's a doc file
          const ext = path.extname(entry.name);
          if (DOC_EXTENSIONS.includes(ext.toLowerCase())) {
            results.push(fullPath);
          }
        }
      }
    } catch {
      // Ignore permission errors and continue
    }

    return results;
  }
}

/**
 * Execute a CLI command
 * @param command - Command name
 * @param projectRoot - Project root directory
 * @param options - Command options
 * @returns CLI result
 */
export async function executeCommand(
  command: string,
  projectRoot: string,
  options?: {
    filePath?: string;
    cache?: VaultCache;
  }
): Promise<CLIResult> {
  const cli = new DelegationCLI(projectRoot);

  switch (command) {
    case 'create-withcontextignore':
      return await cli.createWithContextIgnore();

    case 'check-delegation':
      if (!options?.filePath) {
        return {
          success: false,
          output: '',
          error: cli['formatError']('--check-delegation requires a file path argument'),
        };
      }
      return await cli.checkDelegation(options.filePath);

    case 'delegation-report':
      return await cli.delegationReport();

    case 'cache-stats':
      return await cli.cacheStats(options?.cache);

    case 'cache-clear':
      return await cli.cacheClear(options?.cache);

    default:
      return {
        success: false,
        output: '',
        error: cli['formatError'](`Unknown command: ${command}`),
      };
  }
}
