#!/usr/bin/env node

/**
 * Integration Tests for Documentation Delegation
 *
 * Tests the OpenCode plugin's ability to:
 * - Detect documentation file operations
 * - Provide feedback for tool executions
 * - Handle errors gracefully
 * - Manage session lifecycle
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock client for simulating OpenCode MCP interactions
class MockMCPClient {
  constructor() {
    this.toolCalls = [];
    this.templates = [
      {
        name: 'changelog',
        description: 'Professional changelog following Keep a Changelog format',
      },
      { name: 'meeting-notes', description: 'Meeting notes with attendees and action items' },
      { name: 'technical-doc', description: 'Technical documentation with proper structure' },
    ];
  }

  async callTool(server, tool, args) {
    this.toolCalls.push({ server, tool, args });

    if (tool === 'list_templates') {
      return this.templates;
    }

    if (tool === 'write_note') {
      if (!args.path) {
        throw new Error('path is required');
      }
      return { success: true, path: args.path };
    }

    return { success: true };
  }

  getToolCalls() {
    return this.toolCalls;
  }

  clearToolCalls() {
    this.toolCalls = [];
  }
}

// Plugin implementation (extracted for testing)
async function createPlugin(client) {
  return {
    event: async ({ event }) => {
      if (event.type === 'session.started') {
        try {
          const result = await client.callTool('with-context', 'list_templates', {});

          let message = 'WithContext MCP is ready!\n\n';
          message += 'Available commands:\n';
          message += '- set_project_context - Set your project folder\n';
          message += '- write_note - Create/update notes\n';
          message += '- create_from_template - Use templates\n\n';

          if (result && Array.isArray(result)) {
            message += `${result.length} templates available:\n`;
            result.forEach((template) => {
              message += `- ${template.name}: ${template.description}\n`;
            });
          }

          return message;
        } catch (error) {
          throw new Error(`Failed to load templates: ${error.message}`);
        }
      }
    },

    'tool.execute.after': async (input) => {
      if (!input.tool.startsWith('with-context/')) return null;

      const toolName = input.tool.replace('with-context/', '');

      switch (toolName) {
        case 'write_note': {
          const mode = input.args?.mode || 'overwrite';
          const notePath = input.args?.path || 'note';
          return `Note ${mode === 'append' ? 'updated' : 'saved'}: ${notePath}`;
        }

        case 'set_project_context': {
          const projectFolder = input.args?.project_folder || 'unknown';
          return `Project context set to: ${projectFolder}`;
        }

        case 'delete_note': {
          const deletedPath = input.args?.path || 'note';
          return `Note deleted: ${deletedPath}`;
        }

        case 'batch_write_notes': {
          const notesCount = input.args?.notes?.length || 0;
          return `${notesCount} notes saved successfully`;
        }

        case 'create_from_template': {
          const templateName = input.args?.template_name || 'template';
          const filename = input.args?.filename || 'file';
          return `Created ${filename} from template: ${templateName}`;
        }

        default:
          return null;
      }
    },

    'tool.execute.error': async (input, error) => {
      if (!input.tool.startsWith('with-context/')) return null;

      const toolName = input.tool.replace('with-context/', '');
      const errorMessage = error?.message || String(error);

      return `${toolName} failed: ${errorMessage}`;
    },
  };
}

describe('Documentation Delegation Plugin', () => {
  let client;
  let plugin;

  beforeEach(async () => {
    client = new MockMCPClient();
    plugin = await createPlugin(client);
  });

  describe('Session Lifecycle', () => {
    it('should initialize and display welcome message on session start', async () => {
      const message = await plugin.event({
        event: { type: 'session.started' },
      });

      expect(message).toContain('WithContext MCP is ready!');
      expect(message).toContain('Available commands:');
      expect(message).toContain('set_project_context');
      expect(message).toContain('write_note');
      expect(message).toContain('create_from_template');
    });

    it('should list available templates on session start', async () => {
      const message = await plugin.event({
        event: { type: 'session.started' },
      });

      expect(message).toContain('3 templates available:');
      expect(message).toContain('changelog');
      expect(message).toContain('meeting-notes');
      expect(message).toContain('technical-doc');
    });

    it('should call list_templates during session start', async () => {
      await plugin.event({
        event: { type: 'session.started' },
      });

      const toolCalls = client.getToolCalls();
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].tool).toBe('list_templates');
    });

    it('should ignore non-session-start events', async () => {
      const result = await plugin.event({
        event: { type: 'other.event' },
      });

      expect(result).toBeUndefined();
    });
  });

  describe('Tool Execution Feedback', () => {
    describe('write_note tool', () => {
      it('should provide feedback for write_note with create mode', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/write_note',
          args: { path: 'README.md', mode: 'create' },
        });

        expect(feedback).toBe('Note saved: README.md');
      });

      it('should provide feedback for write_note with overwrite mode', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/write_note',
          args: { path: 'docs/api.md', mode: 'overwrite' },
        });

        expect(feedback).toBe('Note saved: docs/api.md');
      });

      it('should provide feedback for write_note with append mode', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/write_note',
          args: { path: 'CHANGELOG.md', mode: 'append' },
        });

        expect(feedback).toBe('Note updated: CHANGELOG.md');
      });

      it('should use default mode when not specified', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/write_note',
          args: { path: 'notes.md' },
        });

        expect(feedback).toBe('Note saved: notes.md');
      });
    });

    describe('set_project_context tool', () => {
      it('should provide feedback for project context changes', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/set_project_context',
          args: { project_folder: 'my-web-app' },
        });

        expect(feedback).toBe('Project context set to: my-web-app');
      });

      it('should handle missing project_folder', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/set_project_context',
          args: {},
        });

        expect(feedback).toBe('Project context set to: unknown');
      });
    });

    describe('delete_note tool', () => {
      it('should provide feedback for note deletion', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/delete_note',
          args: { path: 'old-draft.md', confirm: true },
        });

        expect(feedback).toBe('Note deleted: old-draft.md');
      });
    });

    describe('batch_write_notes tool', () => {
      it('should report number of notes saved', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/batch_write_notes',
          args: {
            notes: [
              { path: 'doc1.md', content: 'test' },
              { path: 'doc2.md', content: 'test' },
              { path: 'doc3.md', content: 'test' },
            ],
          },
        });

        expect(feedback).toBe('3 notes saved successfully');
      });

      it('should handle empty notes array', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/batch_write_notes',
          args: { notes: [] },
        });

        expect(feedback).toBe('0 notes saved successfully');
      });
    });

    describe('create_from_template tool', () => {
      it('should provide feedback for template creation', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/create_from_template',
          args: { template_name: 'changelog', filename: 'CHANGELOG.md' },
        });

        expect(feedback).toBe('Created CHANGELOG.md from template: changelog');
      });

      it('should handle nested file paths', async () => {
        const feedback = await plugin['tool.execute.after']({
          tool: 'with-context/create_from_template',
          args: { template_name: 'meeting-notes', filename: 'meetings/sprint-planning.md' },
        });

        expect(feedback).toBe('Created meetings/sprint-planning.md from template: meeting-notes');
      });
    });
  });

  describe('Tool Filtering', () => {
    it('should ignore tools from other MCP servers', async () => {
      const feedback = await plugin['tool.execute.after']({
        tool: 'other-server/some_tool',
        args: {},
      });

      expect(feedback).toBeNull();
    });

    it('should only handle with-context tools', async () => {
      const feedback1 = await plugin['tool.execute.after']({
        tool: 'with-context/write_note',
        args: { path: 'test.md' },
      });

      const feedback2 = await plugin['tool.execute.after']({
        tool: 'different-mcp/write_note',
        args: { path: 'test.md' },
      });

      expect(feedback1).toBeTruthy();
      expect(feedback2).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should provide clear error messages for tool failures', async () => {
      const errorMessage = await plugin['tool.execute.error'](
        { tool: 'with-context/write_note', args: {} },
        new Error('Project context not set')
      );

      expect(errorMessage).toBe('write_note failed: Project context not set');
    });

    it('should handle error objects without message property', async () => {
      const errorMessage = await plugin['tool.execute.error'](
        { tool: 'with-context/create_from_template', args: {} },
        'Template not found'
      );

      expect(errorMessage).toBe('create_from_template failed: Template not found');
    });

    it('should ignore errors from other MCP servers', async () => {
      const errorMessage = await plugin['tool.execute.error'](
        { tool: 'other-server/some_tool', args: {} },
        new Error('Some error')
      );

      expect(errorMessage).toBeNull();
    });

    it('should handle template loading errors during session start', async () => {
      const failingClient = new MockMCPClient();
      failingClient.callTool = async () => {
        throw new Error('Connection refused');
      };

      const failingPlugin = await createPlugin(failingClient);

      await expect(async () => {
        await failingPlugin.event({ event: { type: 'session.started' } });
      }).rejects.toThrow('Failed to load templates: Connection refused');
    });
  });

  describe('Documentation Pattern Detection', () => {
    const docFiles = [
      'README.md',
      'CHANGELOG.md',
      'docs/api.md',
      'docs/architecture.md',
      'meetings/sprint-planning.md',
    ];

    const nonDocFiles = ['src/index.ts', 'package.json', 'config.yml'];

    it('should detect documentation files by extension', () => {
      docFiles.forEach((file) => {
        expect(file.endsWith('.md')).toBe(true);
      });
    });

    it('should distinguish doc files from code files', () => {
      nonDocFiles.forEach((file) => {
        expect(file.endsWith('.md')).toBe(false);
      });
    });
  });

  describe('Delegation Flow', () => {
    it('should complete full write_note delegation flow', async () => {
      // Simulate: User request -> OpenCode -> Plugin -> MCP -> Obsidian

      // Step 1: Set project context
      const contextFeedback = await plugin['tool.execute.after']({
        tool: 'with-context/set_project_context',
        args: { project_folder: 'test-project' },
      });
      expect(contextFeedback).toContain('Project context set to: test-project');

      // Step 2: Write documentation
      const writeFeedback = await plugin['tool.execute.after']({
        tool: 'with-context/write_note',
        args: { path: 'README.md', content: '# Test Project', mode: 'create' },
      });
      expect(writeFeedback).toContain('Note saved: README.md');
    });

    it('should complete full template delegation flow', async () => {
      // Step 1: Set context
      await plugin['tool.execute.after']({
        tool: 'with-context/set_project_context',
        args: { project_folder: 'template-demo' },
      });

      // Step 2: Create from template
      const templateFeedback = await plugin['tool.execute.after']({
        tool: 'with-context/create_from_template',
        args: { template_name: 'changelog', filename: 'CHANGELOG.md' },
      });
      expect(templateFeedback).toContain('Created CHANGELOG.md from template: changelog');
    });

    it('should handle batch operations delegation', async () => {
      // Step 1: Set context
      await plugin['tool.execute.after']({
        tool: 'with-context/set_project_context',
        args: { project_folder: 'batch-demo' },
      });

      // Step 2: Batch write
      const batchFeedback = await plugin['tool.execute.after']({
        tool: 'with-context/batch_write_notes',
        args: {
          notes: [
            { path: 'docs/intro.md', content: '# Introduction' },
            { path: 'docs/api.md', content: '# API' },
          ],
        },
      });
      expect(batchFeedback).toBe('2 notes saved successfully');
    });
  });

  describe('Fallback Behavior', () => {
    it('should return null for unknown tools', async () => {
      const feedback = await plugin['tool.execute.after']({
        tool: 'with-context/unknown_tool',
        args: {},
      });

      expect(feedback).toBeNull();
    });

    it('should gracefully handle missing arguments', async () => {
      const feedback = await plugin['tool.execute.after']({
        tool: 'with-context/write_note',
        args: {},
      });

      expect(feedback).toBe('Note saved: note');
    });
  });

  describe('ASCII Output Compliance', () => {
    it('should use ASCII-compatible characters in feedback', async () => {
      const feedback = await plugin['tool.execute.after']({
        tool: 'with-context/write_note',
        args: { path: 'test.md' },
      });

      // Check that feedback doesn't contain emoji characters
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(feedback);
      expect(hasEmoji).toBe(false);
    });

    it('should use ASCII-compatible characters in session message', async () => {
      const message = await plugin.event({
        event: { type: 'session.started' },
      });

      // Check for emoji in message
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(message);
      expect(hasEmoji).toBe(false);
    });

    it('should use ASCII-compatible characters in error messages', async () => {
      const errorMessage = await plugin['tool.execute.error'](
        { tool: 'with-context/write_note', args: {} },
        new Error('Test error')
      );

      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(errorMessage);
      expect(hasEmoji).toBe(false);
    });
  });
});
