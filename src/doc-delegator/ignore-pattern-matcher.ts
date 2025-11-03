/**
 * Ignore Pattern Matcher
 * Handles .opencodeignore pattern matching using micromatch
 * Supports glob patterns, negation patterns, comments, and blank lines
 */

import micromatch from 'micromatch';

/**
 * IgnorePatternMatcher class
 * Provides pattern matching functionality for .opencodeignore files
 */
export class IgnorePatternMatcher {
  private patterns: string[] = [];
  private negatePatterns: string[] = [];
  private compiledPatterns: string[] = [];
  private compiledNegatePatterns: string[] = [];

  /**
   * Create a new IgnorePatternMatcher
   * @param patterns - Array of pattern strings (raw patterns from .opencodeignore)
   */
  constructor(patterns: string[] = []) {
    if (patterns.length > 0) {
      this.parsePatterns(patterns.join('\n'));
    }
  }

  /**
   * Parse patterns from content string
   * Handles comments (#), blank lines, and negation patterns (!)
   * @param content - Raw content from .opencodeignore file
   */
  parsePatterns(content: string): void {
    const lines = content.split(/\r?\n/);
    const patterns: string[] = [];
    const negatePatterns: string[] = [];

    for (const line of lines) {
      // Trim whitespace
      const trimmed = line.trim();

      // Skip comments and blank lines
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Handle negation patterns
      if (trimmed.startsWith('!')) {
        const pattern = trimmed.slice(1).trim();
        if (pattern) {
          negatePatterns.push(pattern);
        }
        continue;
      }

      // Add regular pattern
      patterns.push(trimmed);
    }

    this.patterns = patterns;
    this.negatePatterns = negatePatterns;
    this.compilePatterns();
  }

  /**
   * Compile patterns for micromatch
   * Converts patterns to micromatch-compatible format
   */
  private compilePatterns(): void {
    // Compile regular patterns
    this.compiledPatterns = this.patterns.map((pattern) => this.normalizePattern(pattern));

    // Compile negation patterns
    this.compiledNegatePatterns = this.negatePatterns.map((pattern) =>
      this.normalizePattern(pattern)
    );
  }

  /**
   * Normalize a pattern for consistent matching
   * @param pattern - Raw pattern string
   * @returns Normalized pattern
   */
  private normalizePattern(pattern: string): string {
    let normalized = pattern;

    // Handle root-only patterns (starting with /)
    // These should only match from the root of the project
    const isRootOnly = normalized.startsWith('/');
    if (isRootOnly) {
      normalized = normalized.slice(1);
    }

    // Handle directory patterns (ending with /)
    // Match the directory and everything inside it
    if (normalized.endsWith('/')) {
      // For directory patterns without root anchor, match at any level
      if (!isRootOnly) {
        normalized = '**/' + normalized + '**';
      } else {
        normalized = normalized + '**';
      }
    }

    return normalized;
  }

  /**
   * Normalize a file path for matching
   * Handles Windows vs Unix paths
   * @param filePath - Path to normalize
   * @returns Normalized path (always Unix-style with forward slashes)
   */
  private normalizePath(filePath: string): string {
    // Convert Windows paths to Unix-style
    let normalized = filePath.replace(/\\/g, '/');

    // Remove leading ./ if present
    if (normalized.startsWith('./')) {
      normalized = normalized.slice(2);
    }

    // Remove leading / for relative matching
    if (normalized.startsWith('/')) {
      normalized = normalized.slice(1);
    }

    return normalized;
  }

  /**
   * Check if a file path should be ignored
   * @param filePath - Path to check (relative to project root)
   * @returns true if the file should be ignored, false otherwise
   */
  isIgnored(filePath: string): boolean {
    if (!filePath) {
      return false;
    }

    // Normalize path for consistent matching
    const normalizedPath = this.normalizePath(filePath);

    // If no patterns, nothing is ignored
    if (this.compiledPatterns.length === 0) {
      return false;
    }

    // Check if path matches any ignore patterns
    const isMatched = micromatch.isMatch(normalizedPath, this.compiledPatterns, {
      dot: true, // Match dotfiles
      matchBase: false, // Don't match basename only
      nocase: false, // Case-sensitive by default
    });

    // If not matched by ignore patterns, it's not ignored
    if (!isMatched) {
      return false;
    }

    // Check if path matches any negation patterns (override ignore)
    if (this.compiledNegatePatterns.length > 0) {
      const isNegated = micromatch.isMatch(normalizedPath, this.compiledNegatePatterns, {
        dot: true,
        matchBase: false,
        nocase: false,
      });

      // If negated, it's not ignored
      if (isNegated) {
        return false;
      }
    }

    // Matched by ignore pattern and not negated
    return true;
  }

  /**
   * Get all patterns (for debugging and inspection)
   * @returns Object containing ignore patterns and include (negation) patterns
   */
  getPatterns(): { ignore: string[]; include: string[] } {
    return {
      ignore: [...this.patterns],
      include: [...this.negatePatterns],
    };
  }

  /**
   * Add a new pattern
   * @param pattern - Pattern to add (can include ! for negation)
   */
  addPattern(pattern: string): void {
    const trimmed = pattern.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    if (trimmed.startsWith('!')) {
      const negatePattern = trimmed.slice(1).trim();
      if (negatePattern && !this.negatePatterns.includes(negatePattern)) {
        this.negatePatterns.push(negatePattern);
      }
    } else {
      if (!this.patterns.includes(trimmed)) {
        this.patterns.push(trimmed);
      }
    }

    this.compilePatterns();
  }

  /**
   * Remove a pattern
   * @param pattern - Pattern to remove
   * @returns true if pattern was found and removed, false otherwise
   */
  removePattern(pattern: string): boolean {
    const trimmed = pattern.trim();
    let removed = false;

    if (trimmed.startsWith('!')) {
      const negatePattern = trimmed.slice(1).trim();
      const index = this.negatePatterns.indexOf(negatePattern);
      if (index !== -1) {
        this.negatePatterns.splice(index, 1);
        removed = true;
      }
    } else {
      const index = this.patterns.indexOf(trimmed);
      if (index !== -1) {
        this.patterns.splice(index, 1);
        removed = true;
      }
    }

    if (removed) {
      this.compilePatterns();
    }

    return removed;
  }

  /**
   * Clear all patterns
   */
  clear(): void {
    this.patterns = [];
    this.negatePatterns = [];
    this.compiledPatterns = [];
    this.compiledNegatePatterns = [];
  }

  /**
   * Check if any patterns are loaded
   * @returns true if patterns exist, false otherwise
   */
  hasPatterns(): boolean {
    return this.patterns.length > 0 || this.negatePatterns.length > 0;
  }

  /**
   * Get the number of patterns
   * @returns Total number of patterns (ignore + negation)
   */
  getPatternCount(): number {
    return this.patterns.length + this.negatePatterns.length;
  }
}
