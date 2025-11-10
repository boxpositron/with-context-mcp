/**
 * Configuration Management Tools
 * MCP tools for managing .withcontextconfig.jsonc
 */

import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { validateConfig, type ValidateConfigOptions } from './validate-config.js';
import {
  previewDelegation,
  previewDelegationForFiles,
  type PreviewDelegationOptions,
} from './preview-delegation.js';

/**
 * Validate configuration file
 */
export async function validateConfigTool(args: {
  project_root: string;
  config_path?: string;
}): Promise<string> {
  try {
    const options: ValidateConfigOptions = {
      projectRoot: args.project_root,
      configPath: args.config_path,
    };

    const result = await validateConfig(options);

    // Format output
    const lines: string[] = [];
    lines.push('=== Configuration Validation ===\n');
    lines.push(result.formattedReport);
    lines.push('');

    if (result.errors.length > 0) {
      lines.push('\nErrors must be fixed before using this configuration.');
    }

    if (result.warnings.length > 0) {
      lines.push('\nWarnings are suggestions for improvement but do not prevent usage.');
    }

    return lines.join('\n');
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const validateConfigToolSchema = {
  name: 'validate_config',
  description:
    'Validate .withcontextconfig.jsonc for errors and warnings. Provides detailed feedback on configuration issues.',
  inputSchema: {
    type: 'object',
    properties: {
      project_root: {
        type: 'string',
        description: 'Project root directory',
      },
      config_path: {
        type: 'string',
        description: 'Path to config file (defaults to .withcontextconfig.jsonc)',
      },
    },
    required: ['project_root'],
  },
};

/**
 * Preview delegation decisions
 */
export async function previewDelegationTool(args: {
  project_root: string;
  config_path?: string;
  file_patterns?: string[];
  limit?: number;
  show_reasoning?: boolean;
  vault_only?: boolean;
  local_only?: boolean;
  specific_files?: string[];
}): Promise<string> {
  try {
    // If specific files provided, use different preview function
    if (args.specific_files && args.specific_files.length > 0) {
      const result = await previewDelegationForFiles(
        args.project_root,
        args.specific_files,
        args.config_path,
        args.show_reasoning ?? true
      );

      return result.formattedPreview;
    }

    // Otherwise, preview entire project
    const options: PreviewDelegationOptions = {
      projectRoot: args.project_root,
      configPath: args.config_path,
      filePatterns: args.file_patterns ?? ['**/*.md'],
      limit: args.limit ?? 100,
      showReasoning: args.show_reasoning ?? false,
      vaultOnly: args.vault_only ?? false,
      localOnly: args.local_only ?? false,
    };

    const result = await previewDelegation(options);

    if (!result.success) {
      throw new McpError(ErrorCode.InternalError, result.message);
    }

    return result.formattedPreview;
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(
      ErrorCode.InternalError,
      `Preview failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export const previewDelegationToolSchema = {
  name: 'preview_delegation',
  description:
    'Preview which files will be delegated to vault vs kept local based on configuration patterns. Useful for testing patterns before syncing.',
  inputSchema: {
    type: 'object',
    properties: {
      project_root: {
        type: 'string',
        description: 'Project root directory',
      },
      config_path: {
        type: 'string',
        description: 'Path to config file (defaults to .withcontextconfig.jsonc)',
      },
      file_patterns: {
        type: 'array',
        items: { type: 'string' },
        description: 'Glob patterns for files to preview (defaults to **/*.md)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of files to show per category',
        default: 100,
      },
      show_reasoning: {
        type: 'boolean',
        description: 'Show reasoning for each delegation decision',
        default: false,
      },
      vault_only: {
        type: 'boolean',
        description: 'Show only files going to vault',
        default: false,
      },
      local_only: {
        type: 'boolean',
        description: 'Show only files staying local',
        default: false,
      },
      specific_files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Preview delegation for specific files only',
      },
    },
    required: ['project_root'],
  },
};
