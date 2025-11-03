/**
 * ReadInterceptor - Intercepts read operations and delegates to vault
 * Implements three strategies: local-first, vault-first, vault-only
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ObsidianClient } from '../obsidian/client.js';
import { IgnoreConfig } from './ignore-config.js';
import { VaultCache } from './vault-cache.js';
import { DelegationStrategy, DelegationDecision } from './types.js';
import { DOC_EXTENSIONS } from './constants.js';

/**
 * Configuration for ReadInterceptor
 */
export interface ReadInterceptorOptions {
  /**
   * Obsidian client instance
   */
  client: ObsidianClient;

  /**
   * Ignore configuration instance
   */
  ignoreConfig: IgnoreConfig;

  /**
   * Vault cache instance (optional)
   */
  vaultCache?: VaultCache;

  /**
   * Delegation strategy (default: local-first)
   */
  strategy?: DelegationStrategy;

  /**
   * Project base path (e.g., 'Projects')
   */
  projectBasePath?: string;
}

/**
 * ReadInterceptor class
 * Handles read interception with delegation to vault
 */
export class ReadInterceptor {
  private client: ObsidianClient;
  private ignoreConfig: IgnoreConfig;
  private vaultCache?: VaultCache;
  private strategy: DelegationStrategy;
  private projectBasePath: string;

  /**
   * Create a new ReadInterceptor
   * @param options - Configuration options
   */
  constructor(options: ReadInterceptorOptions) {
    this.client = options.client;
    this.ignoreConfig = options.ignoreConfig;
    this.vaultCache = options.vaultCache;
    this.strategy = options.strategy || 'local-first';
    this.projectBasePath = options.projectBasePath || 'Projects';
  }

  /**
   * Check if a file is a documentation file
   * @param filePath - Absolute or relative file path
   * @returns true if file is a documentation file
   */
  private isDocFile(filePath: string): boolean {
    const ext = path.extname(filePath);

    // Check extension - must be a recognized doc extension
    if (!DOC_EXTENSIONS.includes(ext.toLowerCase())) {
      return false;
    }

    // All files with doc extensions are considered documentation files
    // The ignore patterns will determine whether they should be delegated
    return true;
  }

  /**
   * Check if file exists locally
   * @param filePath - Absolute file path
   * @returns true if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file from local filesystem
   * @param filePath - Absolute file path
   * @returns File content or null
   */
  private async readLocalFile(filePath: string): Promise<string | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch {
      return null;
    }
  }

  /**
   * Read file from vault with caching
   * @param vaultPath - Relative path within vault
   * @returns File content or null
   */
  private async readVaultFile(vaultPath: string): Promise<string | null> {
    // Check cache first
    if (this.vaultCache) {
      const cached = this.vaultCache.get(vaultPath);
      if (cached) {
        return cached.content;
      }
    }

    // Read from vault
    try {
      const content = await this.client.readNote(vaultPath);

      // Cache the result
      if (this.vaultCache && content) {
        this.vaultCache.set(vaultPath, content);
      }

      return content;
    } catch {
      // File not found in vault or other error
      return null;
    }
  }

  /**
   * Convert absolute file path to vault path
   * @param filePath - Absolute file path
   * @param projectRoot - Project root directory
   * @returns Relative vault path
   */
  private toVaultPath(filePath: string, projectRoot: string): string {
    // Get project folder name from project root
    const projectFolder = path.basename(projectRoot);

    // Get relative path from project root
    const relativePath = path.relative(projectRoot, filePath);

    // Construct vault path: Projects/{projectFolder}/{relativePath}
    const vaultPath = path.join(this.projectBasePath, projectFolder, relativePath);

    // Normalize to Unix-style paths
    return vaultPath.replace(/\\/g, '/');
  }

  /**
   * Make delegation decision for a file
   * @param filePath - Absolute file path
   * @param projectRoot - Project root directory
   * @returns DelegationDecision object
   */
  async makeDecision(filePath: string, projectRoot: string): Promise<DelegationDecision> {
    // Check if it's a doc file
    const isDocFile = this.isDocFile(filePath);

    if (!isDocFile) {
      return {
        shouldDelegate: false,
        reason: 'Not a documentation file',
        isDocFile: false,
        matchesIgnorePattern: false,
      };
    }

    // Get relative path from project root
    const relativePath = path.relative(projectRoot, filePath);

    // Check ignore patterns
    const matcher = await this.ignoreConfig.getMatcher();
    const matchesIgnorePattern = matcher.isIgnored(relativePath);

    if (!matchesIgnorePattern) {
      return {
        shouldDelegate: false,
        reason: 'Does not match ignore patterns',
        isDocFile: true,
        matchesIgnorePattern: false,
      };
    }

    // Should delegate
    return {
      shouldDelegate: true,
      reason: 'Matches ignore patterns',
      isDocFile: true,
      matchesIgnorePattern: true,
    };
  }

  /**
   * Intercept read operation and delegate to vault if needed
   * @param filePath - Absolute file path to read
   * @param projectRoot - Project root directory
   * @returns File content formatted with line numbers, or null if should use normal read
   */
  async interceptRead(filePath: string, projectRoot: string): Promise<string | null> {
    // Make delegation decision
    const decision = await this.makeDecision(filePath, projectRoot);

    // If shouldn't delegate, return null (use normal read)
    if (!decision.shouldDelegate) {
      return null;
    }

    // Convert to vault path
    const vaultPath = this.toVaultPath(filePath, projectRoot);

    // Execute strategy
    let content: string | null = null;

    switch (this.strategy) {
      case 'local-first': {
        // Try local first
        const localExistsFirst = await this.fileExists(filePath);
        if (localExistsFirst) {
          content = await this.readLocalFile(filePath);
        }

        // Fallback to vault if local failed
        if (!content) {
          content = await this.readVaultFile(vaultPath);
        }
        break;
      }

      case 'vault-first': {
        // Try vault first
        content = await this.readVaultFile(vaultPath);

        // Fallback to local if vault failed
        if (!content) {
          const localExistsVault = await this.fileExists(filePath);
          if (localExistsVault) {
            content = await this.readLocalFile(filePath);
          }
        }
        break;
      }

      case 'vault-only': {
        // Only read from vault
        content = await this.readVaultFile(vaultPath);

        if (!content) {
          throw new Error(
            `File not found in vault: ${vaultPath}\n` +
              `(vault-only strategy - local filesystem not checked)`
          );
        }
        break;
      }

      default:
        throw new Error(`Unknown delegation strategy: ${this.strategy}`);
    }

    // If no content found, return null
    if (!content) {
      return null;
    }

    // Format content with line numbers (like OpenCode read tool)
    return this.formatWithLineNumbers(content);
  }

  /**
   * Format content with line numbers
   * Mimics the format of OpenCode's read tool (cat -n style)
   * @param content - Raw file content
   * @returns Formatted content with line numbers
   */
  private formatWithLineNumbers(content: string): string {
    const lines = content.split(/\r?\n/);
    const formatted: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const lineNumber = String(i + 1).padStart(5, '0');
      formatted.push(`${lineNumber}| ${lines[i]}`);
    }

    return formatted.join('\n');
  }

  /**
   * Get current delegation strategy
   * @returns Current strategy
   */
  getStrategy(): DelegationStrategy {
    return this.strategy;
  }

  /**
   * Set delegation strategy
   * @param strategy - New strategy to use
   */
  setStrategy(strategy: DelegationStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get cache instance (if enabled)
   * @returns VaultCache instance or undefined
   */
  getCache(): VaultCache | undefined {
    return this.vaultCache;
  }

  /**
   * Clear cache (if enabled)
   */
  clearCache(): void {
    if (this.vaultCache) {
      this.vaultCache.clear();
    }
  }

  /**
   * Get cache statistics (if enabled)
   * @returns Cache stats or null
   */
  getCacheStats() {
    if (this.vaultCache) {
      return this.vaultCache.getStats();
    }
    return null;
  }
}
