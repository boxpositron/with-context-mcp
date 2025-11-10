import { WithContextConfig } from './config-parser.js';

/**
 * Validation issue severity
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Validation issue
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  field?: string;
  suggestion?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

/**
 * Validate configuration and return detailed issues
 */
export function validateConfigSemantic(config: WithContextConfig): ValidationResult {
  const issues: ValidationIssue[] = [];

  // Check for duplicate patterns across vault and local
  const localSet = new Set(config.local);
  const duplicates = config.vault.filter((pattern) => localSet.has(pattern));

  if (duplicates.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Duplicate patterns found in both vault and local: ${duplicates.join(', ')}`,
      field: 'vault/local',
      suggestion: `Remove duplicates and rely on conflictResolution: "${config.conflictResolution}"`,
    });
  }

  // Check for overly broad patterns
  const broadPatterns = ['**', '*', '**/*'];
  const broadVault = config.vault.filter((p) => broadPatterns.includes(p));
  const broadLocal = config.local.filter((p) => broadPatterns.includes(p));

  if (broadVault.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Overly broad patterns in vault: ${broadVault.join(', ')}`,
      field: 'vault',
      suggestion: 'Consider using more specific patterns like "docs/**/*.md"',
    });
  }

  if (broadLocal.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Overly broad patterns in local: ${broadLocal.join(', ')}`,
      field: 'local',
      suggestion: 'Consider using more specific patterns like "src/**/*.md"',
    });
  }

  // Check for potentially conflicting patterns
  if (config.defaultBehavior === 'vault' && config.vault.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Default behavior is "vault" but no explicit vault patterns defined',
      field: 'defaultBehavior',
      suggestion: 'All files will be delegated to vault unless matched by local patterns',
    });
  }

  if (config.defaultBehavior === 'local' && config.local.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Default behavior is "local" but no explicit local patterns defined',
      field: 'defaultBehavior',
      suggestion: 'All files will stay local unless matched by vault patterns',
    });
  }

  // Check for empty patterns arrays
  if (config.vault.length === 0 && config.local.length === 0) {
    issues.push({
      severity: 'warning',
      message: 'No patterns defined for vault or local',
      suggestion: `All files will follow defaultBehavior: "${config.defaultBehavior}"`,
    });
  }

  // Check conflict resolution with no duplicates
  if (config.conflictResolution === 'error' && duplicates.length === 0) {
    issues.push({
      severity: 'info',
      message: 'Conflict resolution set to "error" but no conflicts detected in patterns',
      field: 'conflictResolution',
      suggestion: 'Consider using "local-wins" or "vault-wins" for simpler configuration',
    });
  }

  // Validate glob pattern syntax (basic check)
  const invalidPatterns: string[] = [];
  [...config.vault, ...config.local].forEach((pattern) => {
    // Check for invalid characters or patterns
    if (pattern.includes('\\')) {
      invalidPatterns.push(pattern);
    }
    // Check for double slashes (except at start for absolute paths)
    if (pattern.includes('//') && !pattern.startsWith('//')) {
      invalidPatterns.push(pattern);
    }
  });

  if (invalidPatterns.length > 0) {
    issues.push({
      severity: 'error',
      message: `Invalid glob patterns detected: ${invalidPatterns.join(', ')}`,
      suggestion: 'Use forward slashes (/) and avoid backslashes (\\) in patterns',
    });
  }

  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    issues,
  };
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.valid && result.issues.length === 0) {
    return '[OK] Configuration is valid';
  }

  const lines: string[] = [];

  if (result.valid) {
    lines.push('[OK] Configuration is valid (with warnings/info)');
  } else {
    lines.push('[ERROR] Configuration has errors');
  }

  lines.push('');

  // Group by severity
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');
  const infos = result.issues.filter((i) => i.severity === 'info');

  if (errors.length > 0) {
    lines.push('ERRORS:');
    errors.forEach((issue) => {
      lines.push(`  [X] ${issue.message}`);
      if (issue.field) {
        lines.push(`    Field: ${issue.field}`);
      }
      if (issue.suggestion) {
        lines.push(`    Suggestion: ${issue.suggestion}`);
      }
    });
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('WARNINGS:');
    warnings.forEach((issue) => {
      lines.push(`  [!] ${issue.message}`);
      if (issue.field) {
        lines.push(`    Field: ${issue.field}`);
      }
      if (issue.suggestion) {
        lines.push(`    Suggestion: ${issue.suggestion}`);
      }
    });
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push('INFO:');
    infos.forEach((issue) => {
      lines.push(`  [i] ${issue.message}`);
      if (issue.field) {
        lines.push(`    Field: ${issue.field}`);
      }
      if (issue.suggestion) {
        lines.push(`    Suggestion: ${issue.suggestion}`);
      }
    });
  }

  return lines.join('\n');
}
