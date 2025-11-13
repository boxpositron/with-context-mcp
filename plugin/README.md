# WithContext OpenCode Plugin

Note management and session tracking for OpenCode. Your AI agent writes directly to your Obsidian vault while you code.

## Why This Plugin?

Your AI needs a place to write documentation, track todos, and log changes. This plugin gives it direct access to your Obsidian vault with automatic project scoping.

**You configure it once. OpenCode handles the rest.**

## What It Does

- **Session Management** - Track your work with start/pause/resume/end sessions
- **Changelog Tracking** - AI logs changes with conventional commit types
- **Todo Management** - Track tasks with priorities across sessions
- **Note Operations** - Write, read, search, and organize markdown files
- **Template System** - Generate consistent documentation from templates
- **Sync Tools** - Move docs between local project and vault

## Quick Setup

1. **Install Obsidian REST API plugin** in Obsidian
2. **Copy the plugin file** to `~/.config/opencode/plugin/`
3. **Install the package** in the plugin directory
4. **Set environment variables** for your vault
5. **Restart OpenCode**

Done. Your AI can now write to Obsidian.

## Configuration

Set these environment variables before starting OpenCode:

```bash
# Required - Obsidian REST API settings
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_VAULT="YourVaultName"

# Optional - Base path within vault (default: "Projects")
export PROJECT_BASE_PATH="Projects"
```

**Get your Obsidian credentials:**

1. Install "Local REST API" plugin in Obsidian
2. Enable it in Settings → Community Plugins
3. Go to Settings → Local REST API
4. Copy your API key and note the URL

## Example Workflow

Your AI agent can now manage sessions while it codes:

```typescript
// Start a session
start_session({
  project_folder: 'my-app',
  message: 'Adding user authentication',
});

// AI writes code and documentation
write_note({
  path: 'docs/auth.md',
  content: '# Authentication\n\nJWT-based auth system...',
});

// AI logs what it changed
add_changelog_entry({
  project_folder: 'my-app',
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts'],
});

// AI adds todos for follow-up
add_todo({
  project_folder: 'my-app',
  content: 'Write integration tests for auth',
  priority: 'high',
});

// Get a commit message
get_commit_suggestion({
  project_folder: 'my-app',
  conventional: true,
});
// Returns: "feat: add JWT authentication"

// End the session
end_session({
  project_folder: 'my-app',
  message: 'Auth implementation complete',
});
```

## Installation

**Step 1: Copy the plugin**

```bash
mkdir -p ~/.config/opencode/plugin
cp plugin/with-context.ts ~/.config/opencode/plugin/
```

**Step 2: Install the package**

```bash
cd ~/.config/opencode/plugin
npm install with-context-mcp
```

**Step 3: Set environment variables**

Add to your `.bashrc` or `.zshrc`:

```bash
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_VAULT="YourVaultName"
```

**Step 4: Restart OpenCode**

Verify it loaded:

```typescript
with_context_status();
```

Should return plugin status with version and tools count.

## Advanced: Sync Commands (Optional)

Want to move docs between your project and vault? Set up these commands:

**1. Copy command files:**

```bash
mkdir -p .opencode/command
cp .opencode/command/*.md .opencode/command/
```

**2. Create `.withcontextconfig.jsonc`:**

```jsonc
{
  "defaultBehavior": "vault",
  "vault": ["docs/**/*.md", "*_SUMMARY.md"],
  "local": ["README.md", "CONTRIBUTING.md", "CHANGELOG.md"],
}
```

**3. Use the commands:**

- `/sync-notes` - Bidirectional sync
- `/ingest-notes` - Copy local to vault
- `/teleport-notes` - Download vault to local

All commands preview changes before executing.

## Available Tools

Your AI agent has access to these tools automatically:

**Session Management**

- `start_session`, `pause_session`, `resume_session`, `end_session`
- `get_session_status`

**Change Tracking**

- `add_changelog_entry` - Log changes by type (feature, fix, docs, etc.)
- `get_session_changelog` - View all changes
- `get_commit_suggestion` - Generate commit message

**Todo Management**

- `add_todo`, `update_todo`, `list_todos`

**Note Operations**

- `write_note`, `read_note`, `delete_note`
- `list_notes`, `search_notes`
- `get_note_metadata`, `batch_write_notes`

**Templates**

- `list_templates`, `create_from_template`

**Sync Tools**

- `ingest_notes`, `sync_notes`, `teleport_notes`

**Utilities**

- `set_project_context`, `with_context_status`

Full documentation: [Main README](../README.md) | [Tool Reference](../docs/tools/)

## Troubleshooting

**Plugin not loading?**

- Check `~/.config/opencode/plugin/with-context.ts` exists
- Restart OpenCode
- Check console for errors

**Cannot connect to Obsidian?**

- Obsidian must be running
- Local REST API plugin must be enabled
- Verify `OBSIDIAN_API_KEY` and `OBSIDIAN_API_URL` are correct
- Test: `curl -H "Authorization: Bearer YOUR_KEY" https://127.0.0.1:27124/vault/`

**Notes not found?**

- `OBSIDIAN_VAULT` must be vault name, not path
- Use `list_notes()` to see available files

## Links

**Documentation:** [Main README](../README.md) | [Getting Started](../docs/getting-started.md) | [Configuration](../docs/configuration.md)

**npm:** [with-context-mcp](https://www.npmjs.com/package/with-context-mcp)

**GitHub:** [boxpositron/with-context-mcp](https://github.com/boxpositron/with-context-mcp)

## License

MIT
