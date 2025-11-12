/**
 * Vault Organization Presets
 *
 * Provides pre-configured organization strategies for different use cases.
 * Each preset defines essential files (kept in local repo) and rules for
 * organizing documentation files into vault folders.
 *
 * @module vault-organizer/presets
 */

import type {
  VaultStructure,
  OrganizationPlan,
  OrganizationSuggestion,
  OperationImpact,
  OrganizationWarning,
  EstimatedImpact,
} from './types.js';

// ============================================
// Preset Types
// ============================================

/**
 * Single organization rule within a preset
 *
 * Defines how files matching a pattern should be organized.
 */
export interface PresetRule {
  /** Human-readable name for this rule */
  readonly name: string;
  /** Priority (higher number = higher priority, processed first) */
  readonly priority: number;
  /** Pattern to match files (string for simple matches, RegExp for complex) */
  readonly pattern: string | RegExp;
  /** Target path in vault (supports {YEAR} placeholder for date-based organization) */
  readonly targetPath: string;
  /** Confidence score for this rule (0-1) */
  readonly confidence: number;
  /** Human-readable reason for this organization choice */
  readonly reason: string;
}

/**
 * Complete organization preset
 *
 * Defines a strategy for organizing vault documentation including
 * which files to keep local and how to organize vault files.
 */
export interface OrganizationPreset {
  /** Unique preset identifier */
  readonly id: string;
  /** Human-readable preset name */
  readonly name: string;
  /** Description of this preset's organization strategy */
  readonly description: string;
  /** Files/patterns that should stay in local repository */
  readonly essentialFiles: readonly string[];
  /** Organization rules (processed by priority order) */
  readonly rules: readonly PresetRule[];
}

// ============================================
// Built-in Presets
// ============================================

/**
 * "Clean" preset - Comprehensive vault organization
 *
 * Strategy:
 * - Keep only essential project files in local repository
 * - Organize vault by document type with clear folder structure
 * - Supports year-based organization for meetings
 * - Catches all orphaned docs
 *
 * Essential files: README, AGENTS, LICENSE, CONTRIBUTING, .github/**
 */
const CLEAN_PRESET: OrganizationPreset = {
  id: 'clean',
  name: 'Clean',
  description:
    'Comprehensive vault organization with minimal local files. Organizes by type with clear folder structure.',
  essentialFiles: [
    'README.md',
    'readme.md',
    'AGENTS.md',
    'agents.md',
    'LICENSE',
    'LICENSE.md',
    'CONTRIBUTING.md',
    'contributing.md',
    '.github/**/*',
    'sessions/**/*', // Session management files (vault-only, never reorganize)
    '.sessions/**/*', // Legacy session path
  ],
  rules: [
    {
      name: 'Architecture Documentation',
      priority: 100,
      pattern: /\b(architecture|adr|design-decision|technical-design|system-design)\b/i,
      targetPath: 'docs/architecture',
      confidence: 0.9,
      reason: 'File contains architecture or design decision keywords',
    },
    {
      name: 'API Documentation',
      priority: 95,
      pattern: /\b(api|endpoint|swagger|openapi|rest|graphql)\b/i,
      targetPath: 'docs/api',
      confidence: 0.9,
      reason: 'File contains API documentation keywords',
    },
    {
      name: 'Guides and Tutorials',
      priority: 90,
      pattern: /\b(guide|tutorial|how-to|howto|walkthrough|getting-started)\b/i,
      targetPath: 'docs/guides',
      confidence: 0.85,
      reason: 'File is a guide or tutorial',
    },
    {
      name: 'Meeting Notes with Year',
      priority: 85,
      pattern: /\b(meeting|standup|sync|retrospective|retro)\b/i,
      targetPath: 'meetings/{YEAR}',
      confidence: 0.9,
      reason: 'File is a meeting note, organized by year',
    },
    {
      name: 'Planning Documents',
      priority: 80,
      pattern: /\b(plan|planning|roadmap|milestone|sprint|epic|story|backlog)\b/i,
      targetPath: 'planning',
      confidence: 0.85,
      reason: 'File contains planning or project management content',
    },
    {
      name: 'Research Notes',
      priority: 75,
      pattern: /\b(research|investigation|spike|poc|proof-of-concept|experiment)\b/i,
      targetPath: 'research',
      confidence: 0.85,
      reason: 'File contains research or exploratory work',
    },
    {
      name: 'Changelog',
      priority: 70,
      pattern: /\b(changelog|release-notes|version|history)\b/i,
      targetPath: 'changelog',
      confidence: 0.9,
      reason: 'File tracks changes or release history',
    },
    {
      name: 'General Documentation',
      priority: 60,
      pattern: /\b(doc|documentation|readme|reference)\b/i,
      targetPath: 'docs',
      confidence: 0.75,
      reason: 'File is general documentation',
    },
    {
      name: 'Catch-all for Orphans',
      priority: 10,
      pattern: /.*/,
      targetPath: 'docs',
      confidence: 0.5,
      reason: 'No specific category matched, moved to general docs',
    },
  ],
};

/**
 * "Minimal" preset - Keep most files local
 *
 * Strategy:
 * - Keep most documentation in local repository
 * - Only move ADRs and research notes to vault
 * - Minimal vault organization
 *
 * Essential files: All except ADRs and research
 */
const MINIMAL_PRESET: OrganizationPreset = {
  id: 'minimal',
  name: 'Minimal',
  description:
    'Keep most files local. Only moves ADRs and research notes to vault for separate tracking.',
  essentialFiles: ['**/*'],
  rules: [
    {
      name: 'Architecture Decision Records',
      priority: 100,
      pattern: /\b(adr|architecture-decision|design-decision)\b/i,
      targetPath: 'decisions',
      confidence: 0.9,
      reason: 'ADRs tracked separately in vault',
    },
    {
      name: 'Research Notes',
      priority: 90,
      pattern: /\b(research|investigation|spike|poc|experiment)\b/i,
      targetPath: 'research',
      confidence: 0.85,
      reason: 'Research notes tracked separately in vault',
    },
  ],
};

/**
 * "Docs-as-Code" preset - Mirror repository structure
 *
 * Strategy:
 * - Mirror local repository folder structure in vault
 * - Keep structure familiar for developers
 * - No reorganization, just delegation
 *
 * Essential files: README, LICENSE, CONTRIBUTING
 */
const DOCS_AS_CODE_PRESET: OrganizationPreset = {
  id: 'docs-as-code',
  name: 'Docs-as-Code',
  description:
    'Mirrors local repository structure in vault. Keeps structure familiar without reorganization.',
  essentialFiles: ['README.md', 'LICENSE', 'LICENSE.md', 'CONTRIBUTING.md'],
  rules: [
    {
      name: 'Preserve Directory Structure',
      priority: 100,
      pattern: /.*/,
      targetPath: '{ORIGINAL}',
      confidence: 1.0,
      reason: 'Mirroring local repository structure',
    },
  ],
};

/**
 * "Research" preset - Heavy vault, minimal local
 *
 * Strategy:
 * - Move almost everything to vault for rich linking
 * - Only keep build/config files local
 * - Organize by research themes
 *
 * Essential files: Only build/config files
 */
const RESEARCH_PRESET: OrganizationPreset = {
  id: 'research',
  name: 'Research',
  description:
    'Heavy vault usage with rich linking. Organizes by research themes and topics. Minimal local files.',
  essentialFiles: [
    'README.md',
    'package.json',
    'tsconfig.json',
    '*.config.js',
    '*.config.ts',
    '.github/**/*',
  ],
  rules: [
    {
      name: 'Literature Review',
      priority: 100,
      pattern: /\b(literature|paper|article|study|publication)\b/i,
      targetPath: 'research/literature',
      confidence: 0.9,
      reason: 'Literature review and paper notes',
    },
    {
      name: 'Experiments',
      priority: 95,
      pattern: /\b(experiment|trial|test|evaluation|benchmark)\b/i,
      targetPath: 'research/experiments',
      confidence: 0.9,
      reason: 'Experimental work and evaluations',
    },
    {
      name: 'Concepts and Ideas',
      priority: 90,
      pattern: /\b(concept|idea|theory|hypothesis|brainstorm)\b/i,
      targetPath: 'research/concepts',
      confidence: 0.85,
      reason: 'Conceptual work and ideation',
    },
    {
      name: 'Meeting Notes',
      priority: 85,
      pattern: /\b(meeting|discussion|sync)\b/i,
      targetPath: 'meetings/{YEAR}',
      confidence: 0.9,
      reason: 'Meeting and discussion notes',
    },
    {
      name: 'General Research',
      priority: 80,
      pattern: /.*/,
      targetPath: 'research/notes',
      confidence: 0.7,
      reason: 'General research notes',
    },
  ],
};

// ============================================
// Preset Registry
// ============================================

/**
 * All available presets
 */
const PRESETS: readonly OrganizationPreset[] = [
  CLEAN_PRESET,
  MINIMAL_PRESET,
  DOCS_AS_CODE_PRESET,
  RESEARCH_PRESET,
];

// ============================================
// Public API
// ============================================

/**
 * Gets a preset by ID
 *
 * @param id - Preset identifier
 * @returns Preset if found, null otherwise
 */
export function getPreset(id: string): OrganizationPreset | null {
  return PRESETS.find((preset) => preset.id === id) || null;
}

/**
 * Lists all available presets
 *
 * @returns Array of all presets
 */
export function listPresets(): readonly OrganizationPreset[] {
  return PRESETS;
}

/**
 * Applies a preset to vault structure to generate organization plan
 *
 * Processes files through preset rules (by priority order), extracts year
 * from file paths/names for {YEAR} placeholder, and generates suggestions
 * with confidence scores and impact assessments.
 *
 * @param preset - Organization preset to apply
 * @param vaultStructure - Analyzed vault structure
 * @returns Complete organization plan with suggestions and impact assessment
 */
export function applyPreset(
  preset: OrganizationPreset,
  vaultStructure: VaultStructure
): OrganizationPlan {
  const suggestions: OrganizationSuggestion[] = [];
  const warnings: OrganizationWarning[] = [];

  // Sort rules by priority (highest first)
  const sortedRules = [...preset.rules].sort((a, b) => b.priority - a.priority);

  // Process each file
  for (const file of vaultStructure.files) {
    // Skip session files (vault-only, never reorganize)
    if (isSessionFile(file.path)) {
      continue;
    }

    // Skip if file is essential (should stay local)
    if (isEssentialFile(file.path, preset.essentialFiles)) {
      continue;
    }

    // Find first matching rule
    const matchedRule = sortedRules.find((rule) => matchesPattern(file.path, file.name, rule));

    if (!matchedRule) {
      warnings.push({
        severity: 'warning',
        filePath: file.path,
        message: 'No matching rule found for file',
        suggestion: 'Add a catch-all rule or review preset rules',
      });
      continue;
    }

    // Generate target path
    const targetPath = generateTargetPath(file, matchedRule, vaultStructure.rootPath);

    // Determine operation type
    const currentDir = getDirectoryPath(file.path);
    const targetDir = getDirectoryPath(targetPath);
    const willMove = currentDir !== targetDir;
    const willRename = getFileName(file.path) !== getFileName(targetPath);

    let operationType: 'move' | 'rename' | 'both';
    if (willMove && willRename) {
      operationType = 'both';
    } else if (willMove) {
      operationType = 'move';
    } else if (willRename) {
      operationType = 'rename';
    } else {
      // No operation needed
      continue;
    }

    // Calculate impact
    const impact = calculateImpact(file, vaultStructure);

    // Create suggestion
    suggestions.push({
      type: operationType,
      currentPath: file.path,
      suggestedPath: willMove ? targetPath : undefined,
      suggestedName: willRename ? getFileName(targetPath) : undefined,
      reason: matchedRule.reason,
      confidence: matchedRule.confidence,
      impact,
      targetCategory: matchedRule.targetPath,
    });
  }

  // Calculate estimated impact
  const estimatedImpact = calculateEstimatedImpact(suggestions);

  // Check for risky operations
  const riskyOperations = suggestions.filter(
    (s) => s.impact.complexity === 'high' || s.impact.affectedFiles > 10
  );
  if (riskyOperations.length > 0) {
    warnings.push({
      severity: 'warning',
      message: `${riskyOperations.length} operations marked as high-risk`,
      suggestion: 'Review these operations carefully before executing',
    });
  }

  // Build summary
  const summary = buildSummary(preset, suggestions, estimatedImpact);

  return {
    generatedAt: new Date().toISOString(),
    suggestions,
    estimatedImpact,
    warnings,
    summary,
    requiresManualReview: riskyOperations.length > 0 || estimatedImpact.hasRiskyOperations,
  };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Checks if a file is a session management file (always excluded from reorganization)
 */
function isSessionFile(filePath: string): boolean {
  const normalizedPath = filePath.toLowerCase();
  return (
    normalizedPath.includes('/sessions/') ||
    normalizedPath.includes('/.sessions/') ||
    normalizedPath.startsWith('sessions/') ||
    normalizedPath.startsWith('.sessions/') ||
    normalizedPath.match(/\/sess_[a-z0-9_]+\.json\.md$/) !== null
  );
}

/**
 * Checks if a file matches essential files patterns
 */
function isEssentialFile(filePath: string, essentialFiles: readonly string[]): boolean {
  const fileName = getFileName(filePath);
  const relativePath = filePath.replace(/^projects\/[^/]+\//, '');

  return essentialFiles.some((pattern) => {
    // Exact match
    if (pattern === fileName || pattern === relativePath) {
      return true;
    }

    // Wildcard patterns
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(relativePath) || regex.test(fileName);
    }

    return false;
  });
}

/**
 * Checks if a file matches a preset rule pattern
 */
function matchesPattern(filePath: string, fileName: string, rule: PresetRule): boolean {
  const pattern = rule.pattern;

  // Handle {ORIGINAL} special pattern (docs-as-code)
  if (rule.targetPath === '{ORIGINAL}') {
    return true;
  }

  // Catch-all pattern
  if (pattern instanceof RegExp && pattern.source === '.*') {
    return true;
  }

  // RegExp pattern
  if (pattern instanceof RegExp) {
    return pattern.test(filePath) || pattern.test(fileName);
  }

  // String pattern (case-insensitive substring match)
  const lowerPath = filePath.toLowerCase();
  const lowerName = fileName.toLowerCase();
  const lowerPattern = pattern.toLowerCase();

  return lowerPath.includes(lowerPattern) || lowerName.includes(lowerPattern);
}

/**
 * Generates target path from rule, handling {YEAR} and {ORIGINAL} placeholders
 */
function generateTargetPath(
  file: { path: string; name: string; created: string },
  rule: PresetRule,
  rootPath: string
): string {
  let targetPath = rule.targetPath;

  // Handle {ORIGINAL} placeholder (keep original path)
  if (targetPath === '{ORIGINAL}') {
    return file.path;
  }

  // Handle {YEAR} placeholder
  if (targetPath.includes('{YEAR}')) {
    const year = extractYear(file);
    targetPath = targetPath.replace('{YEAR}', year);
  }

  // Build full path
  return `${rootPath}/${targetPath}/${file.name}`;
}

/**
 * Extracts year from file path, name, or creation date
 */
function extractYear(file: { path: string; name: string; created: string }): string {
  // Try to extract from path or name (YYYY-MM-DD pattern)
  const datePattern = /\b(20\d{2})-\d{2}-\d{2}\b/;
  const pathMatch = file.path.match(datePattern);
  if (pathMatch) {
    return pathMatch[1];
  }

  const nameMatch = file.name.match(datePattern);
  if (nameMatch) {
    return nameMatch[1];
  }

  // Try to extract year directly (20XX pattern)
  const yearPattern = /\b(20\d{2})\b/;
  const pathYearMatch = file.path.match(yearPattern);
  if (pathYearMatch) {
    return pathYearMatch[1];
  }

  // Fall back to creation date
  const createdDate = new Date(file.created);
  return createdDate.getFullYear().toString();
}

/**
 * Calculates impact assessment for a file operation
 */
function calculateImpact(
  file: { path: string; contentMetadata?: { backlinks: readonly string[] } },
  vaultStructure: VaultStructure
): OperationImpact {
  const backlinks = file.contentMetadata?.backlinks || [];
  const affectedFiles = backlinks.length;

  // Count total links to update
  let linksToUpdate = 0;
  const potentialBrokenLinks: string[] = [];

  for (const backlinkPath of backlinks) {
    const backlinkFile = vaultStructure.files.find((f) => f.path === backlinkPath);
    if (backlinkFile?.contentMetadata?.links) {
      const linksToThisFile = backlinkFile.contentMetadata.links.filter((link) =>
        link.includes(file.path)
      );
      linksToUpdate += linksToThisFile.length;
    } else {
      potentialBrokenLinks.push(backlinkPath);
    }
  }

  // Determine complexity
  let complexity: 'low' | 'medium' | 'high';
  if (affectedFiles === 0) {
    complexity = 'low';
  } else if (affectedFiles <= 5) {
    complexity = 'medium';
  } else {
    complexity = 'high';
  }

  return {
    affectedFiles,
    linksToUpdate,
    potentialBrokenLinks,
    complexity,
  };
}

/**
 * Calculates overall estimated impact for all suggestions
 */
function calculateEstimatedImpact(suggestions: readonly OrganizationSuggestion[]): EstimatedImpact {
  const filesToMove = suggestions.filter((s) => s.type === 'move' || s.type === 'both').length;
  const filesToRename = suggestions.filter((s) => s.type === 'rename' || s.type === 'both').length;

  const linksToUpdate = suggestions.reduce((sum, s) => sum + s.impact.linksToUpdate, 0);

  const filesRequiringLinkUpdates = new Set(
    suggestions.flatMap((s) => s.impact.potentialBrokenLinks)
  ).size;

  // Estimate duration: 100ms per operation + 50ms per link update
  const estimatedDuration = suggestions.length * 100 + linksToUpdate * 50;

  const hasRiskyOperations = suggestions.some(
    (s) => s.impact.complexity === 'high' || s.confidence < 0.7
  );

  return {
    filesToMove,
    filesToRename,
    linksToUpdate,
    filesRequiringLinkUpdates,
    estimatedDuration,
    hasRiskyOperations,
  };
}

/**
 * Builds human-readable summary of the plan
 */
function buildSummary(
  preset: OrganizationPreset,
  suggestions: readonly OrganizationSuggestion[],
  impact: EstimatedImpact
): string {
  const parts: string[] = [];

  parts.push(`Applied "${preset.name}" preset to organize vault.`);
  parts.push(`Generated ${suggestions.length} reorganization suggestions.`);

  if (impact.filesToMove > 0) {
    parts.push(`Will move ${impact.filesToMove} files to new locations.`);
  }

  if (impact.filesToRename > 0) {
    parts.push(`Will rename ${impact.filesToRename} files.`);
  }

  if (impact.linksToUpdate > 0) {
    parts.push(
      `Will update ${impact.linksToUpdate} links across ${impact.filesRequiringLinkUpdates} files.`
    );
  }

  if (impact.hasRiskyOperations) {
    parts.push('WARNING: Some operations are high-risk and require manual review.');
  }

  return parts.join(' ');
}

/**
 * Gets directory path from full file path
 */
function getDirectoryPath(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : '';
}

/**
 * Gets filename from full file path
 */
function getFileName(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
}
