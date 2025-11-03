# @opencode/plugin-with-context

OpenCode plugin for with-context-mcp - project-scoped note management in your coding sessions.

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

### Development Setup (npm link)

1. Build the main with-context-mcp package:

```bash
cd /path/to/with-context-mcp
npm install
npm run build
npm link
```

2. Build and link the plugin:

```bash
cd opencode-plugin-with-context
npm install
npm link with-context-mcp
npm run build
```

3. Link to OpenCode:

```bash
# Link to project-level plugin directory
mkdir -p .opencode/plugin
cd .opencode/plugin
ln -s /path/to/with-context-mcp/opencode-plugin-with-context/dist/index.js with-context.js

# Or link to global plugin directory
mkdir -p ~/.config/opencode/plugin
cd ~/.config/opencode/plugin
ln -s /path/to/with-context-mcp/opencode-plugin-with-context/dist/index.js with-context.js
```

### Production Setup (via npm)

```bash
npm install -g @opencode/plugin-with-context
```

Then add to your OpenCode plugin directory as shown above.

## Configuration

Set environment variables in your shell or `.env`:

```bash
# Required: Path to your Obsidian vault
export OBSIDIAN_VAULT_PATH="$HOME/Documents/Vault"

# Required: Obsidian Local REST API settings
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_VAULT="YourVaultName"

# Optional: Base path for projects within vault
export PROJECT_BASE_PATH="Projects"
```

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

## Roadmap

- [x] Batch 1-3: Plugin structure, basic tools, testing (v0.1.0)
- [x] Batch 4: Advanced tools, recursive scanning, full test coverage (v0.2.0)
- [ ] Batch 5: Event hooks, polish, npm publish
- [ ] Future: Additional integrations beyond Obsidian

## License

MIT
