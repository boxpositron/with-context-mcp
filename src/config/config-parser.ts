import { readFileSync } from 'fs';
import { ConfigurationError } from '../types/index.js';

/**
 * Configuration format version
 */
export const CONFIG_VERSION = '2.1';

/**
 * Default behavior for files not matching any patterns
 */
export type DefaultBehavior = 'local' | 'vault';

/**
 * Conflict resolution strategy when file matches both vault and local patterns
 */
export type ConflictResolution = 'local-wins' | 'vault-wins' | 'most-specific-wins' | 'error';

/**
 * Delegation decision for a file
 */
export type DelegationDecision = 'local' | 'vault';

/**
 * WithContext configuration structure (new format)
 */
export interface WithContextConfig {
  /**
   * Configuration format version (must be "2.1")
   */
  version: string;

  /**
   * Default behavior for files not matching any patterns
   * - 'local': Keep in project (safer default)
   * - 'vault': Delegate to Obsidian vault
   */
  defaultBehavior: DefaultBehavior;

  /**
   * Glob patterns for files to delegate to vault
   */
  vault: string[];

  /**
   * Glob patterns for files to keep local
   */
  local: string[];

  /**
   * How to handle files matching both vault and local patterns
   * - 'local-wins': Prefer keeping files local (safer)
   * - 'vault-wins': Prefer delegating to vault
   * - 'most-specific-wins': Use most specific pattern match
   * - 'error': Throw error on conflict
   */
  conflictResolution: ConflictResolution;
}

/**
 * Parse JSONC (JSON with Comments) by stripping comments
 * More sophisticated approach that avoids touching strings
 */
function parseJSONWithComments(jsonString: string): unknown {
  let result = '';
  let inString = false;
  let inSingleLineComment = false;
  let inMultiLineComment = false;
  let escapeNext = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    const nextChar = jsonString[i + 1];

    // Handle escape sequences in strings
    if (escapeNext) {
      if (inString) {
        result += char;
      }
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      if (inString) {
        result += char;
      }
      escapeNext = true;
      continue;
    }

    // Toggle string state
    if (char === '"' && !inSingleLineComment && !inMultiLineComment) {
      inString = !inString;
      result += char;
      continue;
    }

    // Skip if in string
    if (inString) {
      result += char;
      continue;
    }

    // Handle single-line comments
    if (!inMultiLineComment && char === '/' && nextChar === '/') {
      inSingleLineComment = true;
      i++; // Skip next char
      continue;
    }

    if (inSingleLineComment) {
      if (char === '\n' || char === '\r') {
        inSingleLineComment = false;
        result += char; // Keep newline
      }
      continue;
    }

    // Handle multi-line comments
    if (!inSingleLineComment && char === '/' && nextChar === '*') {
      inMultiLineComment = true;
      i++; // Skip next char
      continue;
    }

    if (inMultiLineComment) {
      if (char === '*' && nextChar === '/') {
        inMultiLineComment = false;
        i++; // Skip next char
      }
      continue;
    }

    // Keep character
    result += char;
  }

  // Remove trailing commas before closing braces/brackets
  result = result.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(result);
  } catch (error) {
    throw new ConfigurationError(
      `Failed to parse JSONC: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate config structure
 */
function validateConfig(config: unknown): asserts config is WithContextConfig {
  if (!config || typeof config !== 'object') {
    throw new ConfigurationError('Configuration must be an object');
  }

  const cfg = config as Record<string, unknown>;

  // Validate version
  if (!cfg.version || typeof cfg.version !== 'string') {
    throw new ConfigurationError('Configuration must have a "version" field (string)');
  }

  if (cfg.version !== CONFIG_VERSION) {
    throw new ConfigurationError(
      `Unsupported configuration version: ${cfg.version}. Expected: ${CONFIG_VERSION}`
    );
  }

  // Validate defaultBehavior (optional, defaults to 'local')
  if (cfg.defaultBehavior !== undefined) {
    if (typeof cfg.defaultBehavior !== 'string') {
      throw new ConfigurationError('"defaultBehavior" must be a string');
    }
    if (cfg.defaultBehavior !== 'local' && cfg.defaultBehavior !== 'vault') {
      throw new ConfigurationError(
        `"defaultBehavior" must be "local" or "vault", got: ${cfg.defaultBehavior}`
      );
    }
  }

  // Validate vault patterns (optional, defaults to [])
  if (cfg.vault !== undefined) {
    if (!Array.isArray(cfg.vault)) {
      throw new ConfigurationError('"vault" must be an array of strings');
    }
    for (const pattern of cfg.vault) {
      if (typeof pattern !== 'string' || pattern.length === 0) {
        throw new ConfigurationError('Each vault pattern must be a non-empty string');
      }
    }
  }

  // Validate local patterns (optional, defaults to [])
  if (cfg.local !== undefined) {
    if (!Array.isArray(cfg.local)) {
      throw new ConfigurationError('"local" must be an array of strings');
    }
    for (const pattern of cfg.local) {
      if (typeof pattern !== 'string' || pattern.length === 0) {
        throw new ConfigurationError('Each local pattern must be a non-empty string');
      }
    }
  }

  // Validate conflictResolution (optional, defaults to 'local-wins')
  if (cfg.conflictResolution !== undefined) {
    if (typeof cfg.conflictResolution !== 'string') {
      throw new ConfigurationError('"conflictResolution" must be a string');
    }
    const validResolutions: ConflictResolution[] = [
      'local-wins',
      'vault-wins',
      'most-specific-wins',
      'error',
    ];
    if (!validResolutions.includes(cfg.conflictResolution as ConflictResolution)) {
      throw new ConfigurationError(
        `"conflictResolution" must be one of: ${validResolutions.join(', ')}, got: ${cfg.conflictResolution}`
      );
    }
  }

  // Check for unknown properties
  const knownProps = [
    'version',
    'defaultBehavior',
    'vault',
    'local',
    'conflictResolution',
    '$schema',
  ];
  const unknownProps = Object.keys(cfg).filter((key) => !knownProps.includes(key));
  if (unknownProps.length > 0) {
    throw new ConfigurationError(`Unknown configuration properties: ${unknownProps.join(', ')}`);
  }
}

/**
 * Apply defaults to config
 */
function applyDefaults(config: Partial<WithContextConfig>): WithContextConfig {
  return {
    version: config.version!,
    defaultBehavior: config.defaultBehavior ?? 'local',
    vault: config.vault ?? [],
    local: config.local ?? [],
    conflictResolution: config.conflictResolution ?? 'local-wins',
  };
}

/**
 * Parse .withcontextconfig.jsonc file
 */
export function parseConfigFile(configPath: string): WithContextConfig {
  try {
    const rawContent = readFileSync(configPath, 'utf-8');
    const parsed = parseJSONWithComments(rawContent);
    validateConfig(parsed);
    return applyDefaults(parsed);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(
      `Failed to read config file at ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Parse config from string (for testing)
 */
export function parseConfigString(jsonString: string): WithContextConfig {
  const parsed = parseJSONWithComments(jsonString);
  validateConfig(parsed);
  return applyDefaults(parsed);
}

/**
 * Create default config
 */
export function createDefaultConfig(): WithContextConfig {
  return {
    version: CONFIG_VERSION,
    defaultBehavior: 'local',
    vault: [],
    local: [],
    conflictResolution: 'local-wins',
  };
}
