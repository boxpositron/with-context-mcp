# OpenCode Plugin for with-context-mcp

Project-scoped note management in your OpenCode sessions with Obsidian integration.

> **Version 0.2.0** - 11 tools available

## Features

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

## Installation

### Quick Setup (Copy Plugin)

1. Clone or download this repository:

```bash
git clone https://github.com/davidibia/with-context-mcp.git
cd with-context-mcp
```

2. Install and build the MCP server:

```bash
npm install
npm run build
```

3. Install and build the plugin:

```bash
cd plugin
npm install
npm run build
cd ..
```

4. Copy the plugin to your OpenCode config directory:

```bash
# Create OpenCode plugin directory if it doesn't exist
mkdir -p ~/.config/opencode/plugin

# Copy the built plugin
cp plugin/dist/index.js ~/.config/opencode/plugin/with-context.js

# Or symlink it for development
ln -s "$(pwd)/plugin/dist/index.js" ~/.config/opencode/plugin/with-context.js
```

5. Restart OpenCode to load the plugin.

### Alternative: Project-Level Installation

Instead of global installation, you can install per-project:

```bash
# In your project directory
mkdir -p .opencode/plugin
cp /path/to/with-context-mcp/plugin/dist/index.js .opencode/plugin/with-context.js
```

## Configuration

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
