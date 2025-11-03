# OpenCode Plugin for with-context-mcp

Project-scoped note management in your OpenCode sessions with Obsidian integration.

> **Version 2.0.1** - 14 tools available + 3 custom commands (now as tools!)

## Features

### Core Tools (11 Available)

- **Write & Manage** - Create, update, and append notes with validation
- **Read Notes** - Access note content with full metadata
- **Search** - Find notes by content with case-sensitive options
- **List & Navigate** - Browse notes recursively across subdirectories
- **Metadata** - Get word count, line count, tags, headings, and frontmatter
- **Delete** - Remove notes with confirmation safety
- **Batch Operations** - Write multiple notes in one command
- **Project Context** - Automatic and manual project folder detection
- **Templates** - Create notes from built-in templates (changelog, docs, meetings)
- **Obsidian Integration** - Seamless vault sync via Local REST API
- **Recursive Scanning** - Full vault traversal including subdirectories

### Document Delegation Tools (3 Additional)

- **Sync Notes** - Bidirectionally sync docs between local and vault
- **Ingest Notes** - Copy local documentation to vault (one-way)
- **Teleport Notes** - Download documentation from vault to local (one-way)

These tools provide document delegation using `.withcontextignore` patterns for automated workflow management.

## Plugin vs MCP Server

**The plugin is now the preferred method for using with-context in OpenCode:**

- **Plugin (Recommended)** - Direct integration, no separate server process, better performance
- **MCP Server (Fallback)** - Use when plugin is not available or for other MCP-compatible clients

OpenCode will automatically prefer the plugin when both are configured. The MCP server remains available for other MCP clients like Claude Desktop.

## Installation

### Quick Setup (Recommended)

The plugin is provided as a single TypeScript file - just copy it to your OpenCode config directory:

```bash
# Clone the repository
git clone https://github.com/boxpositron/with-context-mcp.git
cd with-context-mcp

# Install the MCP server dependencies (required for plugin to work)
npm install

# Create OpenCode plugin directory if it doesn't exist
mkdir -p ~/.config/opencode/plugin

# Copy the single-file plugin
cp plugin/with-context.ts ~/.config/opencode/plugin/
```

**Note:** The plugin requires the `with-context-mcp` package to be installed in this directory, as it imports the MCP tool handlers.

### Alternative: Project-Level Installation

Install the plugin per-project instead of globally:

```bash
# In your project directory
mkdir -p .opencode/plugin
cp /path/to/with-context-mcp/plugin/with-context.ts .opencode/plugin/
```

### Requirements

- Node.js 18+
- OpenCode with plugin support
- `with-context-mcp` npm package installed
- Obsidian with Local REST API plugin (for vault integration)

### Verification

After installation, restart OpenCode and verify the plugin loaded:

```typescript
// In OpenCode, run:
with_context_status();

// Should return:
// {
//   "status": "active",
//   "config": {...},
//   "version": "2.0.1",
//   "tools": 14,
//   "custom_commands": 3
// }
```

### Migration from v0.2.0

If you were using the previous multi-file plugin (v0.2.0), simply replace the old file:

```bash
# Remove old plugin
rm ~/.config/opencode/plugin/with-context.js

# Install new single-file plugin
cp plugin/with-context.ts ~/.config/opencode/plugin/

# Restart OpenCode
```

The single-file approach is simpler and doesn't require building - OpenCode handles TypeScript natively.

## Configuration

### Environment Variables

Set environment variables in your shell or `.env` file:

```bash
# Required: Path to your Obsidian vault
export OBSIDIAN_VAULT_PATH="$HOME/Documents/Vault"

# Required: Obsidian Local REST API settings
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_VAULT="YourVaultName"

# Optional: Base path for projects within vault
export PROJECT_BASE_PATH="Projects"
```

### Getting Obsidian API Credentials

1. Install the "Local REST API" plugin in Obsidian
2. Enable the plugin in Settings > Community Plugins
3. Go to Settings > Local REST API
4. Copy your API key
5. Note the API URL (usually https://127.0.0.1:27124)

### OpenCode Custom Commands (Optional)

For enhanced workflow automation, you can set up custom OpenCode commands for document delegation. These commands allow you to quickly sync, ingest, or teleport documentation between your local project and Obsidian vault.

#### Setup Instructions

1. **Copy command files to your project:**

```bash
# In your project root
mkdir -p .opencode/command

# Copy the command files
cp /path/to/with-context-mcp/.opencode/command/*.md .opencode/command/
```

Or create them manually:

2. **Create `.opencode/command/sync-notes.md`:**

```markdown
---
description: Bidirectionally sync documentation files between local project and Obsidian vault
agent: general
---

Use the `sync_notes` tool to bidirectionally synchronize documentation files.

**Tool Priority:** First try plugin's sync_notes, then fallback to MCP server's sync_notes.

**Step 1: Preview** - Call sync_notes with dry_run: true
**Step 2: Sync** - Call sync_notes without dry_run
**Step 3: Report** - Show files moved in both directions

Files matching .withcontextignore patterns are moved between locations (deleted from source).
```

3. **Create `.opencode/command/ingest-notes.md`:**

```markdown
---
description: Ingest local documentation files to Obsidian vault
agent: general
---

Use the `ingest_notes` tool to copy local docs to vault.

**Tool Priority:** First try plugin's ingest_notes, then fallback to MCP server's ingest_notes.

**Step 1: Preview** - Call ingest_notes with dry_run: true
**Step 2: Ingest** - Call ingest_notes without dry_run
**Step 3: Report** - Show ingested files (local files are NOT deleted)
```

4. **Create `.opencode/command/teleport-notes.md`:**

```markdown
---
description: Teleport documentation files from Obsidian vault to local project
agent: general
---

Use the `teleport_notes` tool to download docs from vault.

**Tool Priority:** First try plugin's teleport_notes, then fallback to MCP server's teleport_notes.

**Step 1: Preview** - Call teleport_notes with dry_run: true
**Step 2: Teleport** - Call teleport_notes without dry_run
**Step 3: Report** - Show teleported files (vault files are NOT deleted)
```

5. **Create `.withcontextignore` in your project root:**

```gitignore
# Ignore all markdown files by default
**/*.md

# But keep these local
!README.md
!AGENTS.md
!**/README.md

# Ignore other doc formats
*.txt
*.rst
*.adoc

# Ignore build/deps
dist/
build/
node_modules/
```

#### Using Custom Commands

Once set up, use commands in OpenCode via Ctrl+P:

- `/sync-notes` - Bidirectional sync (moves files both ways)
- `/ingest-notes` - Copy local docs to vault
- `/teleport-notes` - Download docs from vault to local

Commands automatically:

- Preview changes before executing
- Show detailed results
- Preserve directory structure
- Handle errors gracefully

## Available Tools

### Core Operations

- `with_context_status()` - Check plugin configuration and version
- `write_note(path, content, mode)` - Create, update, or append notes
- `read_note(path)` - Read note content with metadata
- `delete_note(path, confirm)` - Delete notes with confirmation

### Discovery & Search

- `list_notes(path?)` - List all notes (recursively scans subdirectories)
- `search_notes(query, case_sensitive?, limit?)` - Search notes by content
- `get_note_metadata(path)` - Get word count, tags, headings, frontmatter

### Advanced Operations

- `batch_write_notes(notes[])` - Write multiple notes at once
- `set_project_context(project_folder)` - Manually set project context
- `list_templates()` - View available note templates
- `create_from_template(template_name, filename, variables)` - Create from template

### Document Delegation

- `ingest_notes(dry_run?, delete_local_files?)` - Copy local docs to vault
- `sync_notes(dry_run?)` - Bidirectionally sync docs between local and vault
- `teleport_notes(dry_run?, delete_from_vault?)` - Download docs from vault to local

## Usage Examples

```typescript
// Check plugin status
with_context_status();

// Write a note
write_note({
  path: 'CHANGELOG.md',
  content: '# Changelog\n\n## v0.2.0\n- Added 11 tools',
  mode: 'create',
});

// Search notes
search_notes({
  query: 'API',
  case_sensitive: false,
  limit: 10,
});

// Create from template
create_from_template({
  template_name: 'changelog',
  filename: 'CHANGELOG.md',
  variables: { version: '0.2.0', project: 'my-app' },
});

// Batch write
batch_write_notes({
  notes: [
    { path: 'docs/api.md', content: '# API Docs', mode: 'create' },
    { path: 'docs/guide.md', content: '# Guide', mode: 'create' },
  ],
});
```

## Development

```bash
# Watch mode for development
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Troubleshooting

**Plugin not loading?**

- Check that the file exists at `~/.config/opencode/plugin/with-context.js`
- Restart OpenCode after copying the plugin
- Check OpenCode console for error messages

**"Cannot connect to Obsidian API" error?**

- Ensure Obsidian is running
- Verify Local REST API plugin is enabled in Obsidian
- Check that `OBSIDIAN_API_URL` and `OBSIDIAN_API_KEY` are set correctly
- Test the API with: `curl -H "Authorization: Bearer YOUR_KEY" https://127.0.0.1:27124/vault/`

**Notes not found?**

- Verify `OBSIDIAN_VAULT_PATH` points to your vault directory
- Check `OBSIDIAN_VAULT` matches your vault name exactly
- Use `list_notes()` to see what files are available

## License

MIT
