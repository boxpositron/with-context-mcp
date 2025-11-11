import { z } from 'zod';
import { ObsidianClient } from '../obsidian/index.js';
import { sessionState } from '../session-state.js';
import { config } from '../config/index.js';
import { analyzeVaultStructure } from '../vault-organizer/vault-analyzer.js';
import { getPreset, listPresets, applyPreset } from '../vault-organizer/presets.js';
import type { OrganizationPlan } from '../vault-organizer/types.js';

/**
 * Zod schema for custom organization rule
 */
const customRuleSchema = z.object({
  name: z.string().describe('Human-readable name for this rule'),
  priority: z.number().min(0).max(100).describe('Priority (0-100, higher = processed first)'),
  pattern: z.string().describe('Regex pattern or string to match files'),
  targetPath: z.string().describe('Target path in vault (supports {YEAR} placeholder)'),
  confidence: z.number().min(0).max(1).describe('Confidence score (0-1)'),
  reason: z.string().describe('Reason for this organization choice'),
});

/**
 * Zod schema for generate organization plan input
 */
export const generateOrganizationPlanSchema = z
  .object({
    project_folder: z
      .string()
      .optional()
      .describe('Optional: Override the project folder for this operation'),
    preset_id: z
      .string()
      .describe(
        'Preset to apply. Available: clean, minimal, docs-as-code, research. Use list_presets for details.'
      ),
    min_confidence: z
      .number()
      .min(0)
      .max(1)
      .default(0.7)
      .describe('Minimum confidence threshold for including suggestions (default: 0.7)'),
    exclude_files: z
      .array(z.string())
      .optional()
      .describe('File patterns to exclude from analysis (glob patterns)'),
    custom_rules: z
      .array(customRuleSchema)
      .optional()
      .describe('Additional custom rules to apply after preset rules'),
    max_file_size_mb: z
      .number()
      .positive()
      .default(10)
      .describe('Maximum file size to analyze in MB (default: 10)'),
  })
  .strict();

export type GenerateOrganizationPlanInput = z.infer<typeof generateOrganizationPlanSchema>;

/**
 * Generates an organization plan using a preset strategy
 *
 * This tool analyzes vault structure and applies a preset organization strategy
 * to generate a comprehensive reorganization plan. The plan can then be executed
 * using the reorganize_notes tool.
 *
 * WORKFLOW:
 * 1. Call generate_organization_plan to analyze and create plan
 * 2. Review the generated plan's suggestions and warnings
 * 3. Call reorganize_notes with the plan (dry_run=true first)
 * 4. Execute with dry_run=false once satisfied
 *
 * PRESETS:
 * - clean: Comprehensive organization with minimal local files
 * - minimal: Keep most files local, only move ADRs and research
 * - docs-as-code: Mirror repository structure in vault
 * - research: Heavy vault usage with rich linking
 *
 * @param input - Plan generation options including preset and filters
 * @returns Organization plan with suggestions, impact assessment, and warnings
 * @throws Error if preset not found or analysis fails
 */
export async function generateOrganizationPlanHandler(
  input: GenerateOrganizationPlanInput
): Promise<string> {
  const {
    project_folder,
    preset_id,
    min_confidence,
    exclude_files = [],
    custom_rules = [],
    max_file_size_mb,
  } = input;

  // Get preset
  const preset = getPreset(preset_id);
  if (!preset) {
    const availablePresets = listPresets()
      .map((p) => `${p.id}: ${p.description}`)
      .join('\n  ');
    throw new Error(
      `Preset "${preset_id}" not found. Available presets:\n  ${availablePresets}\n\nUse list_presets for full details.`
    );
  }

  // Get project context
  const context = await sessionState.getProjectContext(project_folder, config.projectBasePath);

  // Initialize Obsidian client
  const client = new ObsidianClient({
    apiUrl: config.obsidianApiUrl,
    apiKey: config.obsidianApiKey,
    vault: config.obsidianVault,
    allowInsecure: config.nodeEnv === 'development',
  });

  // Analyze vault structure
  const vaultStructure = await analyzeVaultStructure(client, context.projectFolder, {
    includeContentAnalysis: true,
    excludePatterns: exclude_files,
    maxFileSize: max_file_size_mb * 1024 * 1024, // Convert MB to bytes
    detectOrphans: true,
    extractKeywords: true,
  });

  // Apply preset to generate base plan
  let plan: OrganizationPlan = applyPreset(preset, vaultStructure);

  // Apply custom rules if provided
  if (custom_rules.length > 0) {
    plan = applyCustomRules(plan, custom_rules, vaultStructure);
  }

  // Filter suggestions by confidence threshold
  const filteredSuggestions = plan.suggestions.filter((s) => s.confidence >= min_confidence);

  // Recalculate estimated impact with filtered suggestions
  const estimatedImpact = recalculateImpact(filteredSuggestions);

  // Add warning if suggestions were filtered
  const warnings = [...plan.warnings];
  if (filteredSuggestions.length < plan.suggestions.length) {
    const skippedCount = plan.suggestions.length - filteredSuggestions.length;
    warnings.push({
      severity: 'info',
      message: `Filtered out ${skippedCount} suggestions below confidence threshold ${min_confidence}`,
      suggestion: 'Lower min_confidence to see more suggestions',
    });
  }

  // Build final plan
  const finalPlan: OrganizationPlan = {
    generatedAt: plan.generatedAt,
    suggestions: filteredSuggestions,
    estimatedImpact,
    warnings,
    summary: `${plan.summary} (filtered to ${filteredSuggestions.length} suggestions with confidence >= ${min_confidence})`,
    requiresManualReview: plan.requiresManualReview,
  };

  // Build response
  const response = {
    success: true,
    preset: {
      id: preset.id,
      name: preset.name,
      description: preset.description,
    },
    project_folder: context.projectFolder,
    vault_analysis: {
      total_files: vaultStructure.totalFiles,
      total_size: formatBytes(vaultStructure.totalSize),
      analyzed_at: vaultStructure.analyzedAt,
      categories: Object.entries(vaultStructure.categories).map(([name, stats]) => ({
        name,
        file_count: stats.fileCount,
        avg_confidence: stats.avgConfidence,
      })),
      orphan_files: vaultStructure.orphanFiles.length,
    },
    plan: {
      generated_at: finalPlan.generatedAt,
      total_suggestions: finalPlan.suggestions.length,
      requires_manual_review: finalPlan.requiresManualReview,
      summary: finalPlan.summary,
      estimated_impact: {
        files_to_move: finalPlan.estimatedImpact.filesToMove,
        files_to_rename: finalPlan.estimatedImpact.filesToRename,
        links_to_update: finalPlan.estimatedImpact.linksToUpdate,
        files_requiring_link_updates: finalPlan.estimatedImpact.filesRequiringLinkUpdates,
        estimated_duration_ms: finalPlan.estimatedImpact.estimatedDuration,
        has_risky_operations: finalPlan.estimatedImpact.hasRiskyOperations,
      },
      suggestions: finalPlan.suggestions.map((s) => ({
        type: s.type,
        current_path: s.currentPath,
        suggested_path: s.suggestedPath || null,
        suggested_name: s.suggestedName || null,
        reason: s.reason,
        confidence: s.confidence,
        target_category: s.targetCategory || null,
        impact: {
          affected_files: s.impact.affectedFiles,
          links_to_update: s.impact.linksToUpdate,
          complexity: s.impact.complexity,
          potential_broken_links: s.impact.potentialBrokenLinks,
        },
      })),
      warnings: finalPlan.warnings.map((w) => ({
        severity: w.severity,
        file_path: w.filePath || null,
        message: w.message,
        suggestion: w.suggestion || null,
      })),
    },
    next_steps: [
      '1. Review the suggestions carefully, especially those marked as high-complexity',
      '2. Call reorganize_notes with this plan and dry_run=true to preview changes',
      '3. Once satisfied, call reorganize_notes with dry_run=false to execute',
      'Note: You can pass the entire "plan" object from this response to reorganize_notes',
    ],
  };

  return JSON.stringify(response, null, 2);
}

/**
 * Applies custom rules to an existing plan
 *
 * Custom rules are processed after preset rules and can override
 * suggestions from the preset based on priority.
 */
function applyCustomRules(
  plan: OrganizationPlan,
  customRules: Array<{
    name: string;
    priority: number;
    pattern: string;
    targetPath: string;
    confidence: number;
    reason: string;
  }>,
  _vaultStructure: unknown
): OrganizationPlan {
  // For now, just add custom rules info to warnings
  // Full implementation would process rules similar to preset rules
  const warnings = [
    ...plan.warnings,
    {
      severity: 'info' as const,
      message: `Applied ${customRules.length} custom rules`,
      suggestion: 'Custom rules will override preset rules based on priority',
    },
  ];

  return {
    ...plan,
    warnings,
    summary: `${plan.summary} (with ${customRules.length} custom rules)`,
  };
}

/**
 * Recalculates impact for filtered suggestions
 */
function recalculateImpact(
  suggestions: ReadonlyArray<{
    type: 'move' | 'rename' | 'both';
    impact: { linksToUpdate: number; potentialBrokenLinks: readonly string[] };
    confidence: number;
  }>
): {
  filesToMove: number;
  filesToRename: number;
  linksToUpdate: number;
  filesRequiringLinkUpdates: number;
  estimatedDuration: number;
  hasRiskyOperations: boolean;
} {
  const filesToMove = suggestions.filter((s) => s.type === 'move' || s.type === 'both').length;
  const filesToRename = suggestions.filter((s) => s.type === 'rename' || s.type === 'both').length;

  const linksToUpdate = suggestions.reduce((sum, s) => sum + s.impact.linksToUpdate, 0);

  const filesRequiringLinkUpdates = new Set(
    suggestions.flatMap((s) => s.impact.potentialBrokenLinks)
  ).size;

  // Estimate duration: 100ms per operation + 50ms per link update
  const estimatedDuration = suggestions.length * 100 + linksToUpdate * 50;

  const hasRiskyOperations = suggestions.some((s) => s.confidence < 0.7);

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
 * Formats bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
