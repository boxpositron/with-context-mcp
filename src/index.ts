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
import { config } from './config/index.js';
import { setProjectContext, setProjectContextSchema } from './tools/set-project-context.js';
import { writeNote, writeNoteSchema } from './tools/write-note.js';
import { readNote, readNoteSchema } from './tools/read-note.js';
import { listNotes, listNotesSchema } from './tools/list-notes.js';
import { deleteNote, deleteNoteSchema } from './tools/delete-note.js';
import { searchNotes, searchNotesSchema } from './tools/search-notes.js';
import { batchWriteNotes, batchWriteNotesSchema } from './tools/batch-write-notes.js';
import { getNoteMetadata, getNoteMetadataSchema } from './tools/get-note-metadata.js';
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
        'Scan the current project for documentation files that match .withcontextignore patterns and copy them to Obsidian vault. Maintains directory structure.',
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
        'Teleport documentation files from Obsidian vault to local project. Filters by .withcontextignore patterns. Maintains directory structure.',
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
        'Bidirectionally sync documentation files between local project and Obsidian vault. Files matching .withcontextignore patterns are moved between locations (deleted from source after successful copy).',
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
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'set_project_context': {
        const input = setProjectContextSchema.parse(args);
        const result = await setProjectContext(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'write_note': {
        const input = writeNoteSchema.parse(args);
        const result = await writeNote(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'read_note': {
        const input = readNoteSchema.parse(args);
        const result = await readNote(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'list_notes': {
        const input = listNotesSchema.parse(args);
        const result = await listNotes(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'delete_note': {
        const input = deleteNoteSchema.parse(args);
        const result = await deleteNote(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'search_notes': {
        const input = searchNotesSchema.parse(args);
        const result = await searchNotes(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'batch_write_notes': {
        const input = batchWriteNotesSchema.parse(args);
        const result = await batchWriteNotes(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'get_note_metadata': {
        const input = getNoteMetadataSchema.parse(args);
        const result = await getNoteMetadata(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'list_templates': {
        const input = listTemplatesSchema.parse(args);
        const result = await listTemplatesHandler(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'create_from_template': {
        const input = createFromTemplateSchema.parse(args);
        const result = await createFromTemplateHandler(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'ingest_notes': {
        const input = ingestNotesSchema.parse(args);
        const result = await ingestNotes(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'teleport_notes': {
        const input = teleportNotesSchema.parse(args);
        const result = await teleportNotes(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'sync_notes': {
        const input = syncNotesSchema.parse(args);
        const result = await syncNotes(input);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'setup_notes': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await setupNotes(args as any);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'validate_config': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await validateConfigTool(args as any);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      case 'preview_delegation': {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await previewDelegationTool(args as any);
        return {
          content: [{ type: 'text', text: result }],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${message}`);
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
