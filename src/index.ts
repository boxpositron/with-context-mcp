#!/usr/bin/env node

/**
 * WithContext MCP Server
 *
 * MCP server for project-scoped note management across multiple note-taking apps
 * Currently supports: Obsidian (via REST API)
 * Future: Notion, Apple Notes, and more
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { isToolFailure, toolError } from './tools/utils/tool-response.js';
import { config } from './config/index.js';
import { setProjectContext, setProjectContextSchema } from './tools/set-project-context.js';
import { writeNote, writeNoteSchema } from './tools/write-note.js';
import { readNote, readNoteSchema } from './tools/read-note.js';
import { listNotes, listNotesSchema } from './tools/list-notes.js';
import { deleteNote, deleteNoteSchema } from './tools/delete-note.js';
import { searchNotes, searchNotesSchema } from './tools/search-notes.js';
import { healthCheck, healthCheckSchema } from './tools/health-check.js';
import { batchWriteNotes, batchWriteNotesSchema } from './tools/batch-write-notes.js';
import { getNoteMetadata, getNoteMetadataSchema } from './tools/get-note-metadata.js';
import { updateFrontmatter, updateFrontmatterSchema } from './tools/update-frontmatter.js';
import { replaceSection, replaceSectionSchema } from './tools/replace-section.js';
import { listTemplatesHandler, listTemplatesSchema } from './tools/list-templates.js';
import {
  createFromTemplateHandler,
  createFromTemplateSchema,
} from './tools/create-from-template.js';
import { ingestNotes, ingestNotesSchema } from './tools/ingest-notes.js';
import { teleportNotes, teleportNotesSchema } from './tools/teleport-notes.js';
import { syncNotes, syncNotesSchema } from './tools/sync-notes.js';
import { setupNotes, setupNotesSchema } from './tools/setup-notes.js';
import {
  validateConfigTool,
  validateConfigToolSchema,
  previewDelegationTool,
  previewDelegationToolSchema,
} from './tools/config-tools.js';
import {
  startSession,
  startSessionSchema,
  startSessionToolSchema,
  pauseSession,
  pauseSessionSchema,
  pauseSessionToolSchema,
  resumeSession,
  resumeSessionSchema,
  resumeSessionToolSchema,
  endSession,
  endSessionSchema,
  endSessionToolSchema,
  getSessionStatus,
  getSessionStatusSchema,
  getSessionStatusToolSchema,
} from './tools/session-tools.js';
import {
  addChangelogEntry,
  addChangelogEntrySchema,
  addChangelogEntryToolSchema,
  getSessionChangelog,
  getSessionChangelogSchema,
  getSessionChangelogToolSchema,
  getCommitSuggestion,
  getCommitSuggestionSchema,
  getCommitSuggestionToolSchema,
  addTodo,
  addTodoSchema,
  addTodoToolSchema,
  updateTodo,
  updateTodoSchema,
  updateTodoToolSchema,
  listTodos,
  listTodosSchema,
  listTodosToolSchema,
} from './tools/changelog-todo-tools.js';
import {
  analyzeVaultStructureHandler,
  analyzeVaultStructureSchema,
} from './tools/analyze-vault-structure.js';
import { reorganizeNotesHandler, reorganizeNotesSchema } from './tools/reorganize-notes.js';
import {
  generateOrganizationPlanHandler,
  generateOrganizationPlanSchema,
} from './tools/generate-organization-plan.js';

// Initialize MCP Server
const server = new Server(
  {
    name: 'with-context-mcp',
    version: '3.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'set_project_context',
      description:
        'Set the project folder context for this session. All subsequent operations will use this folder unless overridden.',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'The project folder name within the vault (e.g., "my-web-app")',
          },
        },
        required: ['project_folder'],
      },
    },
    {
      name: 'write_note',
      description:
        'Write or update a markdown note in the project folder. Supports create, overwrite, and append modes.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md")',
          },
          content: {
            type: 'string',
            description: 'Content to write to the note',
          },
          mode: {
            type: 'string',
            enum: ['create', 'overwrite', 'append'],
            default: 'overwrite',
            description:
              'Write mode: create (fail if exists), overwrite (replace), or append (add to end)',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['path', 'content'],
      },
    },
    {
      name: 'read_note',
      description: 'Read the content of a markdown note from the project folder.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'Relative path to the note within the project folder (e.g., "CHANGELOG.md")',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'list_notes',
      description: 'List all notes in a folder within the project.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Optional: Relative path to a subfolder (defaults to project root)',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
      },
    },
    {
      name: 'delete_note',
      description:
        'Delete a markdown note from the project folder. Requires explicit confirmation.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the note to delete',
          },
          confirm: {
            type: 'boolean',
            description: 'Must be set to true to confirm deletion',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['path', 'confirm'],
      },
    },
    {
      name: 'search_notes',
      description:
        'Search for notes by content within the project folder. Returns matching files with snippets showing context around matches.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query text to find in note contents',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          case_sensitive: {
            type: 'boolean',
            default: false,
            description: 'Whether to perform case-sensitive search (default: false)',
          },
          limit: {
            type: 'number',
            default: 10,
            description: 'Maximum number of results to return (default: 10)',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'health_check',
      description:
        'Perform a comprehensive health check of the with-context-mcp environment. ' +
        'Validates environment variables, Obsidian API connection, and configuration. ' +
        'Returns detailed status and recommendations for fixing any issues. Fast (< 2 seconds).',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Project folder to check for .withcontextconfig.jsonc',
          },
        },
      },
    },
    {
      name: 'batch_write_notes',
      description:
        'Write multiple notes at once. Processes each note independently and returns a summary with per-note status.',
      inputSchema: {
        type: 'object',
        properties: {
          notes: {
            type: 'array',
            description: 'Array of notes to write',
            items: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Relative path to the note within the project folder',
                },
                content: {
                  type: 'string',
                  description: 'Content to write to the note',
                },
                mode: {
                  type: 'string',
                  enum: ['create', 'overwrite', 'append'],
                  default: 'overwrite',
                  description:
                    'Write mode: create (fail if exists), overwrite (replace), or append (add to end)',
                },
              },
              required: ['path', 'content'],
            },
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['notes'],
      },
    },
    {
      name: 'get_note_metadata',
      description:
        'Get metadata about a note including word count, line count, frontmatter, tags, and headings.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the note within the project folder',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['path'],
      },
    },
    {
      name: 'update_frontmatter',
      description:
        'Update YAML frontmatter in a markdown note. Supports merge (add/update fields while preserving others) and replace (overwrite entire frontmatter) modes. Automatically creates frontmatter if it does not exist.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the note within the project folder',
          },
          frontmatter: {
            type: 'object',
            description:
              'Frontmatter fields to update as key-value pairs (e.g., {"title": "My Note", "tags": ["dev", "mcp"]})',
          },
          mode: {
            type: 'string',
            enum: ['merge', 'replace'],
            description:
              'Update mode: "merge" to add/update fields (preserving others), "replace" to overwrite entire frontmatter',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['path', 'frontmatter', 'mode'],
      },
    },
    {
      name: 'replace_section',
      description:
        'Replace a section in a markdown note by heading. Supports three modes: content-only (replace section content, preserve heading), full (replace both heading and content), heading-only (replace heading text, preserve content). Can create section if missing (content-only mode). Includes preview mode to see changes before applying.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative path to the note within the project folder',
          },
          heading: {
            type: 'string',
            description:
              'Heading text to find (without # symbols, e.g., "Installation" not "## Installation")',
          },
          content: {
            type: 'string',
            description: 'New content for the section',
          },
          mode: {
            type: 'string',
            enum: ['content-only', 'full', 'heading-only'],
            default: 'content-only',
            description:
              'Replace mode: "content-only" (default, replace section content only), "full" (replace both heading and content), "heading-only" (replace heading text only)',
          },
          level: {
            type: 'number',
            description:
              'Optional: Filter by heading level (1-6). Use to disambiguate duplicate headings.',
          },
          index: {
            type: 'number',
            description:
              'Optional: Which occurrence to replace if duplicates exist (0-based). Use to disambiguate.',
          },
          preview: {
            type: 'boolean',
            default: false,
            description: 'Preview changes without applying them. Returns before/after comparison.',
          },
          createIfMissing: {
            type: 'boolean',
            default: false,
            description:
              'Create section at end of file if not found. Only applies to content-only mode.',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['path', 'heading', 'content'],
      },
    },
    {
      name: 'list_templates',
      description:
        'List all available note templates with their descriptions and required variables.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'create_from_template',
      description:
        'Create a new note from a template. Templates support variable substitution and auto-fill common variables like date and time.',
      inputSchema: {
        type: 'object',
        properties: {
          template_name: {
            type: 'string',
            description: 'Name of the template to use',
          },
          filename: {
            type: 'string',
            description: 'Filename for the new note (e.g., "CHANGELOG.md" or "docs/meeting.md")',
          },
          variables: {
            type: 'object',
            description:
              'Variables to substitute in the template (e.g., {"version": "1.0.0", "author": "John"})',
          },
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
        },
        required: ['template_name', 'filename'],
      },
    },
    {
      name: 'ingest_notes',
      description:
        'Scan the current project for documentation files with delegation decision "vault" (configured in .withcontextconfig.jsonc) and copy them to Obsidian vault. Maintains directory structure.',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          dry_run: {
            type: 'boolean',
            default: false,
            description: 'If true, show what would be ingested without actually writing files',
          },
          delete_local_files: {
            type: 'boolean',
            default: false,
            description:
              'If true, delete local files after successful ingestion. Use with caution!',
          },
          force_delete: {
            type: 'boolean',
            default: false,
            description: 'If true, skip safety checks when deleting. Use with extreme caution!',
          },
        },
      },
    },
    {
      name: 'teleport_notes',
      description:
        'Teleport documentation files from Obsidian vault to local project. Only files with delegation decision "vault" (configured in .withcontextconfig.jsonc) are teleported. Maintains directory structure.',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          dry_run: {
            type: 'boolean',
            default: false,
            description: 'If true, show what would be teleported without actually writing files',
          },
          delete_from_vault: {
            type: 'boolean',
            default: false,
            description:
              'If true, delete files from vault after successful teleport. Use with caution!',
          },
          force_delete: {
            type: 'boolean',
            default: false,
            description: 'If true, skip safety checks when deleting. Use with extreme caution!',
          },
        },
      },
    },
    {
      name: 'sync_notes',
      description:
        'Bidirectionally sync documentation files between local project and Obsidian vault. Files with delegation decision "vault" are moved to vault, files with decision "local" are moved to project (deleted from source after successful copy). Configured in .withcontextconfig.jsonc.',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          dry_run: {
            type: 'boolean',
            default: false,
            description: 'If true, show what would be synced without actually moving files',
          },
        },
      },
    },
    setupNotesSchema,
    validateConfigToolSchema,
    previewDelegationToolSchema,
    startSessionToolSchema,
    pauseSessionToolSchema,
    resumeSessionToolSchema,
    endSessionToolSchema,
    getSessionStatusToolSchema,
    addChangelogEntryToolSchema,
    getSessionChangelogToolSchema,
    getCommitSuggestionToolSchema,
    addTodoToolSchema,
    updateTodoToolSchema,
    listTodosToolSchema,
    {
      name: 'analyze_vault_structure',
      description:
        'Analyze the complete structure of a vault for the current project. Scans all markdown files, extracts metadata, builds folder and category statistics, and identifies orphan files. Useful for understanding vault organization and identifying areas for improvement.',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          exclude_patterns: {
            type: 'array',
            items: { type: 'string' },
            default: [],
            description:
              'Optional: Glob patterns to exclude from analysis (e.g., ["*.tmp", "drafts/*"])',
          },
          include_categories: {
            type: 'boolean',
            default: true,
            description: 'Optional: Whether to include category statistics in results',
          },
          include_orphans: {
            type: 'boolean',
            default: true,
            description: 'Optional: Whether to identify orphan files (no incoming/outgoing links)',
          },
          max_file_size_mb: {
            type: 'number',
            default: 10,
            description: 'Optional: Maximum file size in MB to analyze (default: 10)',
          },
          max_files: {
            type: 'number',
            description: 'Optional: Maximum number of files to analyze (for limiting large vaults)',
          },
        },
      },
    },
    {
      name: 'reorganize_notes',
      description:
        'Execute notes reorganization based on an OrganizationPlan (from analyze_vault_structure). Applies move and rename operations to improve vault organization. SAFETY: Defaults to dry_run=true for safe previewing. Supports automatic link updating, backup creation, and rollback on failure.',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          plan: {
            type: 'object',
            description: 'The reorganization plan to execute (from analyze_vault_structure)',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['rename', 'move', 'both'] },
                    currentPath: { type: 'string' },
                    suggestedPath: { type: 'string' },
                    suggestedName: { type: 'string' },
                    reason: { type: 'string' },
                    confidence: { type: 'number' },
                    impact: {
                      type: 'object',
                      properties: {
                        affectedFiles: { type: 'number' },
                        linksToUpdate: { type: 'number' },
                        potentialBrokenLinks: { type: 'array', items: { type: 'string' } },
                        complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
                      },
                    },
                    targetCategory: { type: 'string' },
                  },
                  required: ['type', 'currentPath', 'reason', 'confidence'],
                },
              },
              estimatedImpact: {
                type: 'object',
                properties: {
                  filesToMove: { type: 'number' },
                  filesToRename: { type: 'number' },
                  linksToUpdate: { type: 'number' },
                  filesRequiringLinkUpdates: { type: 'number' },
                  estimatedDuration: { type: 'number' },
                  hasRiskyOperations: { type: 'boolean' },
                },
              },
              warnings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    severity: { type: 'string', enum: ['info', 'warning', 'error'] },
                    filePath: { type: 'string' },
                    message: { type: 'string' },
                    suggestion: { type: 'string' },
                  },
                },
              },
              summary: { type: 'string' },
              requiresManualReview: { type: 'boolean' },
            },
            required: ['suggestions'],
          },
          dry_run: {
            type: 'boolean',
            default: true,
            description:
              'If true, preview operations without making changes (default: true for safety)',
          },
          update_links: {
            type: 'boolean',
            default: true,
            description: 'If true, automatically update links in other files (default: true)',
          },
          create_backup: {
            type: 'boolean',
            default: true,
            description: 'If true, create backups before executing (default: true)',
          },
          min_confidence: {
            type: 'number',
            default: 0.7,
            description: 'Minimum confidence threshold for executing operations (default: 0.7)',
          },
        },
        required: ['plan'],
      },
    },
    {
      name: 'generate_organization_plan',
      description:
        'Generate an organization plan using a preset strategy. Analyzes vault structure and applies preset rules to create comprehensive reorganization suggestions. Use this BEFORE reorganize_notes. Available presets: clean (comprehensive), minimal (keep local), docs-as-code (mirror structure), research (heavy vault).',
      inputSchema: {
        type: 'object',
        properties: {
          project_folder: {
            type: 'string',
            description: 'Optional: Override the project folder for this operation',
          },
          preset_id: {
            type: 'string',
            description:
              'Preset to apply: "clean", "minimal", "docs-as-code", or "research". Use list_presets for details.',
          },
          min_confidence: {
            type: 'number',
            default: 0.7,
            description: 'Minimum confidence threshold for including suggestions (default: 0.7)',
          },
          exclude_files: {
            type: 'array',
            items: { type: 'string' },
            description: 'File patterns to exclude from analysis (glob patterns)',
          },
          custom_rules: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                priority: { type: 'number' },
                pattern: { type: 'string' },
                targetPath: { type: 'string' },
                confidence: { type: 'number' },
                reason: { type: 'string' },
              },
              required: ['name', 'priority', 'pattern', 'targetPath', 'confidence', 'reason'],
            },
            description: 'Additional custom rules to apply after preset rules',
          },
          max_file_size_mb: {
            type: 'number',
            default: 10,
            description: 'Maximum file size to analyze in MB (default: 10)',
          },
        },
        required: ['preset_id'],
      },
    },
  ],
}));

/**
 * Wrap a tool result string, detecting {success: false} pattern
 * and setting isError accordingly so LLMs can see failures.
 */
function wrapToolResult(result: string) {
  return {
    content: [{ type: 'text' as const, text: result }],
    ...(isToolFailure(result) && { isError: true }),
  };
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'set_project_context': {
        const input = setProjectContextSchema.parse(args);
        const result = await setProjectContext(input);
        return wrapToolResult(result);
      }

      case 'write_note': {
        const input = writeNoteSchema.parse(args);
        const result = await writeNote(input);
        return wrapToolResult(result);
      }

      case 'read_note': {
        const input = readNoteSchema.parse(args);
        const result = await readNote(input);
        return wrapToolResult(result);
      }

      case 'list_notes': {
        const input = listNotesSchema.parse(args);
        const result = await listNotes(input);
        return wrapToolResult(result);
      }

      case 'delete_note': {
        const input = deleteNoteSchema.parse(args);
        const result = await deleteNote(input);
        return wrapToolResult(result);
      }

      case 'search_notes': {
        const input = searchNotesSchema.parse(args);
        const result = await searchNotes(input);
        return wrapToolResult(result);
      }

      case 'health_check': {
        const input = healthCheckSchema.parse(args);
        const result = await healthCheck(input);
        return wrapToolResult(JSON.stringify(result, null, 2));
      }

      case 'batch_write_notes': {
        const input = batchWriteNotesSchema.parse(args);
        const result = await batchWriteNotes(input);
        return wrapToolResult(result);
      }

      case 'get_note_metadata': {
        const input = getNoteMetadataSchema.parse(args);
        const result = await getNoteMetadata(input);
        return wrapToolResult(result);
      }

      case 'update_frontmatter': {
        const input = updateFrontmatterSchema.parse(args);
        const result = await updateFrontmatter(input);
        return wrapToolResult(result);
      }

      case 'replace_section': {
        const input = replaceSectionSchema.parse(args);
        const result = await replaceSection(input);
        return wrapToolResult(result);
      }

      case 'list_templates': {
        const input = listTemplatesSchema.parse(args);
        const result = await listTemplatesHandler(input);
        return wrapToolResult(result);
      }

      case 'create_from_template': {
        const input = createFromTemplateSchema.parse(args);
        const result = await createFromTemplateHandler(input);
        return wrapToolResult(result);
      }

      case 'ingest_notes': {
        const input = ingestNotesSchema.parse(args);
        const result = await ingestNotes(input);
        return wrapToolResult(result);
      }

      case 'teleport_notes': {
        const input = teleportNotesSchema.parse(args);
        const result = await teleportNotes(input);
        return wrapToolResult(result);
      }

      case 'sync_notes': {
        const input = syncNotesSchema.parse(args);
        const result = await syncNotes(input);
        return wrapToolResult(result);
      }

      case 'setup_notes': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await setupNotes(args as any);
        return wrapToolResult(result);
      }

      case 'validate_config': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await validateConfigTool(args as any);
        return wrapToolResult(result);
      }

      case 'preview_delegation': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await previewDelegationTool(args as any);
        return wrapToolResult(result);
      }

      case 'start_session': {
        const input = startSessionSchema.parse(args);
        const result = await startSession(input);
        return wrapToolResult(result);
      }

      case 'pause_session': {
        const input = pauseSessionSchema.parse(args);
        const result = await pauseSession(input);
        return wrapToolResult(result);
      }

      case 'resume_session': {
        const input = resumeSessionSchema.parse(args);
        const result = await resumeSession(input);
        return wrapToolResult(result);
      }

      case 'end_session': {
        const input = endSessionSchema.parse(args);
        const result = await endSession(input);
        return wrapToolResult(result);
      }

      case 'get_session_status': {
        const input = getSessionStatusSchema.parse(args);
        const result = await getSessionStatus(input);
        return wrapToolResult(result);
      }

      case 'add_changelog_entry': {
        const input = addChangelogEntrySchema.parse(args);
        const result = await addChangelogEntry(input);
        return wrapToolResult(result);
      }

      case 'get_session_changelog': {
        const input = getSessionChangelogSchema.parse(args);
        const result = await getSessionChangelog(input);
        return wrapToolResult(result);
      }

      case 'get_commit_suggestion': {
        const input = getCommitSuggestionSchema.parse(args);
        const result = await getCommitSuggestion(input);
        return wrapToolResult(result);
      }

      case 'add_todo': {
        const input = addTodoSchema.parse(args);
        const result = await addTodo(input);
        return wrapToolResult(result);
      }

      case 'update_todo': {
        const input = updateTodoSchema.parse(args);
        const result = await updateTodo(input);
        return wrapToolResult(result);
      }

      case 'list_todos': {
        const input = listTodosSchema.parse(args);
        const result = await listTodos(input);
        return wrapToolResult(result);
      }

      case 'analyze_vault_structure': {
        const input = analyzeVaultStructureSchema.parse(args);
        const result = await analyzeVaultStructureHandler(input);
        return wrapToolResult(result);
      }

      case 'reorganize_notes': {
        const input = reorganizeNotesSchema.parse(args);
        const result = await reorganizeNotesHandler(input);
        return wrapToolResult(result);
      }

      case 'generate_organization_plan': {
        const input = generateOrganizationPlanSchema.parse(args);
        const result = await generateOrganizationPlanHandler(input);
        return wrapToolResult(result);
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    // Protocol errors - re-throw as-is (tool not found, capability issues)
    if (error instanceof McpError) {
      // Only MethodNotFound should be a protocol error
      if (error.code === ErrorCode.MethodNotFound) {
        throw error;
      }
      // Other McpErrors (InvalidRequest, etc.) become tool errors so LLM can see them
      return toolError(error.message);
    }

    // Zod validation errors -> InvalidParams (protocol level, schema violation)
    if (error instanceof z.ZodError) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Invalid parameters: ${error.errors.map((e) => e.message).join(', ')}`
      );
    }

    // All other errors -> tool error (LLM can see and self-correct)
    const message = error instanceof Error ? error.message : String(error);
    return toolError(message);
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('WithContext MCP Server v2.1.0');
  console.error(`Backend: Obsidian`);
  console.error(`Vault: ${config.obsidianVault}`);
  console.error(`Base Path: ${config.projectBasePath}`);
  console.error('Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
