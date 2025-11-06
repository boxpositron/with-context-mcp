/**
 * Legacy Ignore Parser
 * Converts .withcontextignore format to .withcontextconfig.jsonc format
 * Supports backwards compatibility during migration period
 */

import { readFileSync } from 'fs';
import { WithContextConfig, CONFIG_VERSION } from './config-parser.js';

/**
 * Parse .withcontextignore content
 * Returns array of patterns (excluding comments and blank lines)
 */
function parseIgnoreContent(content: string): string[] {
  const lines = content.split(/\r?\n/);
  const patterns: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and blank lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // In .withcontextignore, patterns mean "keep local" (inverted logic)
    // So we add them to the result as-is
    patterns.push(trimmed);
  }

  return patterns;
}

/**
 * Convert .withcontextignore patterns to .withcontextconfig.jsonc
 *
 * IMPORTANT: .withcontextignore uses INVERTED LOGIC:
 * - Patterns in .withcontextignore = files to KEEP LOCAL (not delegate)
 * - Files NOT matching patterns = delegate to vault
 *
 * New format is explicit:
 * - defaultBehavior: "vault" (because old format delegated by default)
 * - local: [patterns from .withcontextignore]
 * - vault: [] (no explicit vault patterns in old format)
 */
export function convertIgnoreToConfig(ignoreContent: string): WithContextConfig {
  const localPatterns = parseIgnoreContent(ignoreContent);

  return {
    version: CONFIG_VERSION,
    defaultBehavior: 'vault', // Old behavior: delegate unless matched
    vault: [], // Old format had no explicit vault patterns
    local: localPatterns, // Patterns from .withcontextignore = keep local
    conflictResolution: 'local-wins', // Safe default
  };
}

/**
 * Parse .withcontextignore file and convert to new config format
 */
export function parseIgnoreFile(ignoreFilePath: string): WithContextConfig {
  const content = readFileSync(ignoreFilePath, 'utf-8');
  return convertIgnoreToConfig(content);
}

/**
 * Generate .withcontextconfig.jsonc content from .withcontextignore
 * Includes helpful comments explaining the conversion
 */
export function generateConfigFromIgnore(ignoreContent: string): string {
  const config = convertIgnoreToConfig(ignoreContent);

  // Generate JSONC with comments
  const jsonc = `{
  "$schema": "https://raw.githubusercontent.com/yourusername/with-context-mcp/main/src/config/config-schema.json",

  // Configuration format version
  "version": "${config.version}",

  // Default behavior for files not matching any patterns
  // "vault" = delegate to Obsidian (matches old .withcontextignore behavior)
  // "local" = keep in project
  "defaultBehavior": "${config.defaultBehavior}",

  // Patterns for files to delegate to Obsidian vault
  "vault": ${JSON.stringify(config.vault, null, 2)},

  // Patterns for files to keep in local project
  // (converted from .withcontextignore)
  "local": ${JSON.stringify(config.local, null, 2)},

  // How to handle conflicts when file matches both vault and local patterns
  "conflictResolution": "${config.conflictResolution}"
}
`;

  return jsonc;
}

/**
 * Check if content looks like .withcontextignore format
 * Returns true if it doesn't have JSON structure
 */
export function isLegacyIgnoreFormat(content: string): boolean {
  const trimmed = content.trim();

  // Empty file
  if (trimmed.length === 0) {
    return true;
  }

  // Starts with { = likely JSON
  if (trimmed.startsWith('{')) {
    return false;
  }

  // Starts with comment or pattern = likely old format
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('*')) {
    return true;
  }

  // Check for JSON keywords
  if (trimmed.includes('"version"') || trimmed.includes('"defaultBehavior"')) {
    return false;
  }

  // Default to assuming it's legacy format
  return true;
}
