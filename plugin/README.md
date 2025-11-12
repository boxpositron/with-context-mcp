# WithContext OpenCode Plugin

Intelligent note management and session tracking plugin for OpenCode.

> **Version 3.0.4** - Production ready with full session persistence, automatic filename slugification, and zero TypeScript warnings. Auto-tracking awaits OpenCode plugin API enhancements.

## Features

### Current (v3.0.4)

✅ **Automatic Filename Slugification** - Consistent, URL-safe filenames:

- Converts filenames to lowercase (e.g., `"My Notes"` → `"my-notes.md"`)
- Replaces spaces and special characters with hyphens
- Preserves case for well-known files (README, CHANGELOG, LICENSE, etc.)
- Ensures compatibility across all operating systems

### Current (v3.0.0)

✅ **14 Native Tools** - All with-context-mcp tools available as native OpenCode tools:

- Note management (write, read, list, search, delete, batch operations, metadata)
- Template system (list templates, create from template)
- Sync operations (ingest, teleport, sync)
- Project context management
- Plugin status check

✅ **Manual Session Management** - Full control over your development sessions:

- Start/pause/resume/end sessions
- Track changelog entries with conventional commit types
- Manage todos with priorities and status tracking
- View comprehensive session status and summaries
- Generate conventional commit messages from session data
- Session persistence with automatic archiving

✅ **Production Ready** - Dog-fooded and tested with real projects

### Future (Awaiting OpenCode Plugin API)

⏳ **Auto-Tracking** - Automatic file operation tracking:

- Automatically track file reads and modifications
- Smart changelog suggestions based on file patterns
- One-time session start prompts
- Idle session status display

⏳ **Intelligent Suggestions** - AI-powered workflow assistance:

- Auto-categorize changes (feature vs fix vs refactor)
- Suggest todos based on code patterns
- Generate commit messages from session data

See [PLUGIN_AUTO_TRACKING.md](../docs/PLUGIN_AUTO_TRACKING.md) for full implementation details.

## Auto-Session Management

The plugin includes intelligent auto-session management that can automatically track your development workflow.

### Configuration

Control auto-session behavior with environment variables:

```bash
# Auto-start session on first file operation (default: true)
export WITH_CONTEXT_AUTO_START=true

# Auto-track file operations (default: true)
export WITH_CONTEXT_AUTO_TRACK=true

# Prompt user before auto-starting (default: true)
export WITH_CONTEXT_PROMPT=true
```

### Environment Variables

| Variable                  | Default | Description                                         |
| ------------------------- | ------- | --------------------------------------------------- |
| `WITH_CONTEXT_AUTO_START` | `true`  | Automatically start session on first file operation |
| `WITH_CONTEXT_AUTO_TRACK` | `true`  | Track file reads and modifications automatically    |
| `WITH_CONTEXT_PROMPT`     | `true`  | Show one-time prompt before auto-starting session   |

### Configuration Examples

**Fully Automatic (Recommended):**

```bash
export WITH_CONTEXT_AUTO_START=true
export WITH_CONTEXT_AUTO_TRACK=true
export WITH_CONTEXT_PROMPT=true
```

**Manual Control:**

```bash
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=true
```

**Silent Mode:**

```bash
export WITH_CONTEXT_AUTO_START=false
export WITH_CONTEXT_AUTO_TRACK=false
export WITH_CONTEXT_PROMPT=false
```

### How It Works

1. **Project Detection** - Automatically detects project folder from git repository or directory name
2. **Session Check** - Checks for active session on first file operation
3. **Auto-Start** - Optionally starts session automatically (if enabled)
4. **Smart Analysis** - Analyzes file changes to suggest changelog types

### Smart File Analysis

The plugin analyzes file paths to suggest appropriate changelog types:

| File Pattern             | Type      | Example                |
| ------------------------ | --------- | ---------------------- |
| `*.test.ts`, `*.spec.js` | `test`    | "Add tests for auth"   |
| `docs/**/*.md`           | `docs`    | "Update documentation" |
| `*.config.ts`            | `chore`   | "Update configuration" |
| `*.ts`, `*.js`, `*.py`   | `feature` | "Update auth"          |

### Documentation

For comprehensive documentation, see:

- **[Plugin Auto-Tracking Guide](../docs/PLUGIN_AUTO_TRACKING.md)** - Complete feature documentation
- **[Test Results](../TEST_RESULTS_PLUGIN_AUTO_SESSION.md)** - Test coverage (58 tests)

## Quick Start

### Manual Workflow (Current)

```typescript
// 1. Start a session
await use_tool('start_session', {
  project_folder: 'my-project',
  message: 'Implementing user authentication',
});

// 2. Work on your code using OpenCode...
// (use OpenCode's built-in read/write/edit tools)

// 3. Track your changes
await use_tool('add_changelog_entry', {
  project_folder: 'my-project',
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts', 'src/middleware.ts'],
});

// 4. Add todos for follow-up work
await use_tool('add_todo', {
  project_folder: 'my-project',
  content: 'Write integration tests for auth flow',
  priority: 'high',
});

// 5. Check your session status anytime
await use_tool('get_session_status', {
  project_folder: 'my-project',
});

// 6. Generate a commit message
await use_tool('get_commit_suggestion', {
  project_folder: 'my-project',
  conventional: true,
});

// 7. End your session
await use_tool('end_session', {
  project_folder: 'my-project',
  message: 'Auth implementation complete',
});
```

## Plugin vs MCP Server

**The plugin is now the preferred method for using with-context in OpenCode:**

- **Plugin (Recommended)** - Direct integration, no separate server process, better performance, includes session management
- **MCP Server (Fallback)** - Use when plugin is not available or for other MCP-compatible clients

OpenCode will automatically prefer the plugin when both are configured. The MCP server remains available for other MCP clients like Claude Desktop.

## Installation

### Quick Setup (Recommended)

The plugin is provided as a single TypeScript file - just copy it to your OpenCode config directory:

```bash
# Clone the repository
git clone https://github.com/boxpositron/with-context-mcp.git
cd with-context-mcp

# Install the with-context-mcp package (required for plugin to work)
npm install

# Create OpenCode plugin directory if it doesn't exist
mkdir -p ~/.config/opencode/plugin

# Copy the single-file plugin
cp plugin/with-context.ts ~/.config/opencode/plugin/

# IMPORTANT: Install with-context-mcp in the plugin directory so OpenCode can access it
cd ~/.config/opencode/plugin
npm install with-context-mcp
```

**Note:** The plugin imports MCP tool handlers from `with-context-mcp/tools`, so the package must be installed in the `~/.config/opencode/plugin/` directory where OpenCode can resolve it.

### Alternative: Project-Level Installation

Install the plugin per-project instead of globally:

```bash
# In your project directory
mkdir -p .opencode/plugin
cp /path/to/with-context-mcp/plugin/with-context.ts .opencode/plugin/

# Install with-context-mcp package in the plugin directory
cd .opencode/plugin
npm install with-context-mcp
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
//   "version": "3.0.4",
//   "tools": 25,
//   "custom_commands": 3,
//   "features": {
//     "filename_slugification": true,
//     "path_resolution": "project-folder-based",
//     "ascii_only_output": true,
//     "type_safety": "zero-warnings"
//   }
// }
```

### Migration from v2.x

If you were using v2.x, the upgrade is seamless - just update the files:

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
# Required: Obsidian Local REST API settings
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_VAULT="YourVaultName"  # Vault name only, not path

# Optional: Base path for projects within vault (default: "Projects")
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

### Session Management

- `start_session(project_folder, message?)` - Start a new development session
- `pause_session(project_folder)` - Pause the current session
- `resume_session(project_folder, session_id?)` - Resume a paused session
- `end_session(project_folder, message?)` - Complete and archive the session
- `get_session_status(project_folder)` - View comprehensive session details

### Changelog Tracking

- `add_changelog_entry(project_folder, type, message, files?, breaking?)` - Add a changelog entry
- `get_session_changelog(project_folder)` - View all changelog entries grouped by type
- `get_commit_suggestion(project_folder, conventional?)` - Generate conventional commit message

### Todo Management

- `add_todo(project_folder, content, priority?)` - Add a todo with priority (high/medium/low)
- `update_todo(project_folder, todo_id, status?, priority?)` - Update todo status or priority
- `list_todos(project_folder, status?, priority?)` - List all todos with optional filters

### Note Operations

- `write_note(path, content, mode?, project_folder?)` - Create, update, or append notes (auto-slugifies filenames)
- `read_note(path, project_folder?)` - Read note content with metadata
- `delete_note(path, confirm, project_folder?)` - Delete notes with confirmation
- `get_note_metadata(path, project_folder?)` - Get word count, tags, headings, frontmatter
- `batch_write_notes(notes[], project_folder?)` - Write multiple notes at once (auto-slugifies all filenames)

### Discovery & Search

- `list_notes(path?, project_folder?)` - List all notes (recursively scans subdirectories)
- `search_notes(query, project_folder?, case_sensitive?, limit?)` - Search notes by content

### Templates

- `list_templates()` - View available note templates
- `create_from_template(template_name, filename, variables?, project_folder?)` - Create from template

### Sync Operations

- `ingest_notes(project_folder?, dry_run?, delete_local_files?, force_delete?)` - Copy local docs to vault
- `sync_notes(project_folder?, dry_run?)` - Bidirectionally sync docs between local and vault
- `teleport_notes(project_folder?, dry_run?, delete_from_vault?, force_delete?)` - Download docs from vault to local

### Utilities

- `set_project_context(project_folder)` - Set the active project context
- `with_context_status()` - Check plugin configuration and version

## Usage Examples

```typescript
// Check plugin status
with_context_status();

// Write a note (filename auto-slugified)
write_note({
  path: 'My Project Notes', // Becomes: my-project-notes.md
  content: '# My Notes\n\nThis is a test.',
  mode: 'create',
});

// Well-known files preserve case
write_note({
  path: 'README', // Becomes: README.md (case preserved)
  content: '# Project Name',
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

- Check `OBSIDIAN_VAULT` matches your vault name exactly (not a path)
- Verify the Obsidian Local REST API is running
- Use `list_notes()` to see what files are available

## License

MIT
