/**
 * Ignore Configuration Singleton
 * Loads and manages .withcontextignore file patterns
 * Provides global access to ignore pattern matcher
 */

import { promises as fs } from 'fs';
import path from 'path';
import { IgnorePatternMatcher } from './ignore-pattern-matcher.js';

/**
 * Singleton class for managing ignore configuration
 * Loads patterns from .withcontextignore file in project root
 */
export class IgnoreConfig {
  private static instance: IgnoreConfig | null = null;
  private matcher: IgnorePatternMatcher;
  private projectRoot: string;
  private ignoreFilePath: string;
  private loaded: boolean = false;
  private ignoreFileExists: boolean = false;

  /**
   * Private constructor for singleton pattern
   * @param projectRoot - Root directory of the project
   */
  private constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.ignoreFilePath = path.join(projectRoot, '.withcontextignore');
    this.matcher = new IgnorePatternMatcher();
  }

  /**
   * Get singleton instance
   * @param projectRoot - Root directory of the project (required for first call)
   * @returns IgnoreConfig instance
   */
  static getInstance(projectRoot?: string): IgnoreConfig {
    // If instance exists and no projectRoot specified, return existing
    if (IgnoreConfig.instance && !projectRoot) {
      return IgnoreConfig.instance;
    }

    // If projectRoot specified, create new instance or update existing
    if (projectRoot) {
      // If instance exists but projectRoot changed, create new instance
      if (IgnoreConfig.instance && IgnoreConfig.instance.projectRoot !== projectRoot) {
        IgnoreConfig.instance = new IgnoreConfig(projectRoot);
      } else if (!IgnoreConfig.instance) {
        IgnoreConfig.instance = new IgnoreConfig(projectRoot);
      }
      return IgnoreConfig.instance;
    }

    // No instance and no projectRoot - error
    throw new Error('IgnoreConfig.getInstance() requires projectRoot parameter for first call');
  }

  /**
   * Reset singleton instance (useful for testing)
   */
  static resetInstance(): void {
    IgnoreConfig.instance = null;
  }

  /**
   * Load ignore patterns from .withcontextignore file
   * If file doesn't exist, returns empty matcher (backwards compatible)
   * Handles file read errors gracefully
   */
  async loadIgnoreFile(): Promise<void> {
    try {
      // Check if file exists
      try {
        await fs.access(this.ignoreFilePath);
        this.ignoreFileExists = true;
      } catch {
        // File doesn't exist - this is OK, just use empty matcher
        this.ignoreFileExists = false;
        this.loaded = true;
        this.matcher.clear();
        return;
      }

      // Read file content
      const content = await fs.readFile(this.ignoreFilePath, 'utf-8');

      // Parse patterns
      this.matcher.parsePatterns(content);
      this.loaded = true;
    } catch (error) {
      // Handle read errors gracefully
      const err = error as NodeJS.ErrnoException;

      if (err.code === 'ENOENT') {
        // File doesn't exist - backwards compatible
        this.ignoreFileExists = false;
        this.loaded = true;
        this.matcher.clear();
        return;
      }

      if (err.code === 'EACCES') {
        // Permission denied - log warning and continue with empty matcher
        console.warn(
          `Warning: Cannot read .withcontextignore file (permission denied): ${this.ignoreFilePath}`
        );
        this.loaded = true;
        this.matcher.clear();
        return;
      }

      // Other errors - log warning and continue with empty matcher
      console.warn(
        `Warning: Error reading .withcontextignore file: ${err.message || 'Unknown error'}`
      );
      this.loaded = true;
      this.matcher.clear();
    }
  }

  /**
   * Get the ignore pattern matcher
   * Automatically loads patterns if not already loaded
   * @returns IgnorePatternMatcher instance
   */
  async getMatcher(): Promise<IgnorePatternMatcher> {
    if (!this.loaded) {
      await this.loadIgnoreFile();
    }
    return this.matcher;
  }

  /**
   * Get the ignore pattern matcher synchronously
   * Throws if patterns haven't been loaded yet
   * @returns IgnorePatternMatcher instance
   */
  getMatcherSync(): IgnorePatternMatcher {
    if (!this.loaded) {
      throw new Error('Ignore patterns not loaded. Call loadIgnoreFile() or getMatcher() first.');
    }
    return this.matcher;
  }

  /**
   * Reload ignore patterns from file
   * Useful when .withcontextignore file is modified
   */
  async reload(): Promise<void> {
    this.loaded = false;
    await this.loadIgnoreFile();
  }

  /**
   * Get the path to the ignore file
   * @returns Full path to .withcontextignore file
   */
  getIgnoreFilePath(): string {
    return this.ignoreFilePath;
  }

  /**
   * Check if ignore file exists
   * Only accurate after loadIgnoreFile() has been called
   * @returns true if .withcontextignore file exists
   */
  hasIgnoreFile(): boolean {
    return this.ignoreFileExists;
  }

  /**
   * Check if ignore patterns have been loaded
   * @returns true if patterns have been loaded (even if file doesn't exist)
   */
  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Get project root directory
   * @returns Project root path
   */
  getProjectRoot(): string {
    return this.projectRoot;
  }
}
