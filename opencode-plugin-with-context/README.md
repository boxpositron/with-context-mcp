# @opencode/plugin-with-context

OpenCode plugin for with-context-mcp - project-scoped note management in your coding sessions.

## Features

- 📝 Write and manage notes within OpenCode sessions
- 🔍 Search notes by content
- 📊 Get note metadata (word count, tags, headings)
- 📦 Batch operations for multiple notes
- 🎯 Project-scoped context management
- 🔗 Integrates with Obsidian (more apps coming soon)

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

## Usage

Once installed, the plugin provides custom tools in OpenCode:

```typescript
// Check plugin status
with_context_status();

// Write or update a note
write_note({
  path: 'CHANGELOG.md',
  content: '# Changelog\n\n## v0.1.0\n- Initial release',
  mode: 'create',
});

// Read a note
read_note({
  path: 'CHANGELOG.md',
});

// More tools coming in future batches:
// - search_notes
// - list_notes
// - get_note_metadata
// - batch_write_notes
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

- [x] Batch 1: Plugin structure and setup
- [x] Batch 2: Basic tools (write_note, read_note)
- [ ] Batch 3: Testing and validation with npm link
- [ ] Batch 4: Additional tools (search, list, metadata, batch operations)
- [ ] Batch 5: Event hooks and polish

## License

MIT
