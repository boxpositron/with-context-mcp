# WithContext MCP Server

[![npm version](https://badge.fury.io/js/with-context-mcp.svg)](https://www.npmjs.com/package/with-context-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for project-scoped note management. Allows AI coding agents to write markdown documentation directly to your note-taking apps with automatic project folder scoping for security.

**Currently supports:** Obsidian (via REST API)  
**Coming soon:** Notion, Apple Notes, and more

## Installation

```bash
# Using npx (no installation needed)
npx -y with-context-mcp

# Or install globally
npm install -g with-context-mcp
```

## Features

- **Project-Scoped Access**: Each project gets its own folder within your vault
- **Session Context**: Set project once, use across multiple operations
- **Security**: Path validation prevents directory traversal attacks
- **Multiple Write Modes**: Create, overwrite, or append to notes
- **Template System**: Professional templates with variable substitution
- **Batch Operations**: Write multiple notes at once
- **Metadata Extraction**: Get word count, tags, headings, frontmatter
- **Documentation Delegation**: Control which docs are delegated to vault with `.withcontextignore`
- **Read Interception**: Automatically read delegated docs from vault with caching
- **CLI Tools**: Manage delegation patterns and view reports

## Prerequisites

1. **A supported note-taking app:**
   - **Obsidian** with the **Local REST API** plugin installed (primary backend)
2. **Node.js** 18+

## Setup

### 1. Install Obsidian REST API Plugin

1. Open Obsidian Settings
2. Go to Community Plugins → Browse
3. Search for "Local REST API"
4. Install and Enable
5. Go to plugin settings and copy your API key

### 2. Add to MCP Client

#### OpenCode (Recommended)

OpenCode is an AI coding agent built for the terminal with excellent MCP server support and custom command capabilities.

**Config file location:**

- **All platforms:** `opencode.jsonc` in your project root

Add the with-context MCP server to your `opencode.jsonc`:

```jsonc
{
  "mcp": {
    "with-context": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "with-context-mcp"],
      "environment": {
        "OBSIDIAN_API_KEY": "{env:OBSIDIAN_API_KEY}",
        "OBSIDIAN_API_URL": "{env:OBSIDIAN_API_URL}",
        "OBSIDIAN_VAULT": "{env:OBSIDIAN_VAULT}",
        "PROJECT_BASE_PATH": "{env:PROJECT_BASE_PATH}",
      },
      "enabled": true,
    },
  },
}
```

**Configuration values:**

- `type`: Must be `"local"` for locally-executed MCP servers
- `command`: Use `"npx"` to run without installation
- `args`: Include `"-y"` flag to auto-confirm package execution
- `environment`: Environment variables for the MCP server (use `{env:VAR_NAME}` syntax to reference environment variables):
  - `OBSIDIAN_API_KEY`: Your API key from Obsidian Settings → Local REST API
  - `OBSIDIAN_API_URL`: REST API endpoint (default: `https://127.0.0.1:27124`)
  - `OBSIDIAN_VAULT`: Your vault name (visible in Obsidian sidebar)
  - `PROJECT_BASE_PATH`: Base folder in vault for projects (default: `"Projects"`)
- `enabled`: Set to `true` to activate the server

Make sure to set these environment variables in your shell before starting OpenCode, or create a `.env` file in your project root.

**Usage Tips:**

1. **Mention the server in prompts** to ensure OpenCode uses it:

   ```
   Use the with-context MCP server to create a CHANGELOG.md for this project
   ```

2. **Add rules to AGENTS.md** to make OpenCode automatically use the server for documentation tasks. Create or edit `AGENTS.md` in your project root:

   ```markdown
   ## Documentation Guidelines

   - Use the with-context MCP server for all project documentation
   - Create changelogs in CHANGELOG.md using append mode
   - Store API docs in docs/api/ folder
   - Always set project context before writing notes
   ```

3. **Verify server is loaded** by checking OpenCode's startup messages. You should see:

   ```
   ✓ Loaded MCP server: with-context
   ```

4. **First-time setup** in a new project:
   ```
   Set project context to "my-project-name" and create a README.md
   ```

**Example Commands:**

```bash
# Start OpenCode in your project directory
opencode

# Example prompts to try:
# "Set the project context to my-web-app"
# "Create a CHANGELOG.md and add today's updates"
# "List all notes in the docs folder"
# "Search for API documentation"
```

**Troubleshooting:**

- If the server doesn't load, verify your `opencode.jsonc` is valid JSON/JSONC
- Check that all environment variables are properly quoted strings
- Ensure Obsidian and the REST API plugin are running
- Restart OpenCode after modifying `opencode.jsonc`

#### OpenCode Custom Commands

OpenCode supports custom slash commands that can be created as markdown files in the `.opencode/command/` directory. These commands provide quick access to common with-context operations with automatic dry-run previews and detailed reporting.

**Setup Instructions:**

1. **Create the commands directory:**

```bash
# In your project root
mkdir -p .opencode/command
```

2. **Create custom command files:**

**`.opencode/command/setup-ignore.md`** - Setup .withcontextignore for your project:

```markdown
---
description: Setup .withcontextignore file for the project
agent: general
---

Create a `.withcontextignore` file in the current project root to configure which documentation files should be delegated to the Obsidian vault.

The .withcontextignore file controls which documentation files (like .md, .txt) are kept local vs delegated to your Obsidian vault via the with-context MCP server.

## Your task:

1. **Analyze the project structure** to understand what type of project this is (monorepo, library, web app, etc.)

2. **Read the template** from `.withcontextignore.template` in the with-context-mcp repository

3. **Create `.withcontextignore`** in the current working directory with appropriate patterns based on:
   - Project type (monorepo, library, app, etc.)
   - Existing directory structure (docs/, internal/, etc.)
   - Common patterns that make sense for this project

4. **Customize the patterns** by:
   - Keeping relevant sections from the template
   - Removing irrelevant sections
   - Adding project-specific patterns
   - Ensuring sensible defaults (node_modules, dist, build, etc. are ignored)

5. **Explain** what you created and why certain patterns were chosen

## Guidelines:

- Keep internal/private docs local (not delegated)
- Keep work-in-progress and drafts local
- Keep sensitive information local
- Delegate public-facing documentation to vault
- Ignore build output and generated files
- Use clear comments to explain patterns

The user may provide additional context like "$ARGUMENTS" to customize the setup further.
```

**`.opencode/command/sync.md`** - Bidirectional sync between local and vault:

```markdown
---
description: Bidirectionally sync documentation files between local project and Obsidian vault
agent: general
model: claude-3-5-sonnet-20241022
subtask: true
---

Use the `sync_notes` tool to bidirectionally synchronize documentation files.

**Arguments:** $ARGUMENTS (optional flags)

**Step 1: Preview** - Call sync_notes with dry_run: true
**Step 2: Sync** - If user approves, call sync_notes without dry_run
**Step 3: Report** - Show files moved in both directions

Files matching .withcontextignore patterns are moved between locations (deleted from source).
```

**`.opencode/command/ingest.md`** - Copy local docs to vault:

```markdown
---
description: Ingest local documentation files to Obsidian vault
agent: general
model: claude-3-5-sonnet-20241022
subtask: true
---

Use the `ingest_notes` tool to copy local docs to vault.

**Arguments:** $ARGUMENTS (optional: --delete to remove local files after ingestion)

**Step 1: Preview** - Call ingest_notes with dry_run: true
**Step 2: Ingest** - If user approves, call ingest_notes with appropriate parameters
**Step 3: Report** - Show ingested files and whether local files were deleted
```

**`.opencode/command/teleport.md`** - Download docs from vault to local:

```markdown
---
description: Teleport documentation files from Obsidian vault to local project
agent: general
model: claude-3-5-sonnet-20241022
subtask: true
---

Use the `teleport_notes` tool to download docs from vault.

**Arguments:** $ARGUMENTS (optional: --delete to remove vault files after teleport)

**Step 1: Preview** - Call teleport_notes with dry_run: true
**Step 2: Teleport** - If user approves, call teleport_notes with appropriate parameters
**Step 3: Report** - Show teleported files and whether vault files were deleted
```

3. **Create `.withcontextignore` in your project root:**

```bash
# Generate from template
npx with-context-mcp --create-withcontextignore

# Or create manually
cat > .withcontextignore << 'EOF'
# Delegate all markdown files
**/*.md

# But keep these local
!README.md
!AGENTS.md
!LICENSE

# Delegate other doc formats
*.txt
*.rst

# Keep build artifacts local
dist/
build/
node_modules/
EOF
```

**Using Custom Commands:**

Once set up, use the commands in OpenCode:

```bash
# Press Ctrl+P to open command palette, then:
/setup-ignore      # Setup .withcontextignore for current project
/sync              # Bidirectional sync with preview
/ingest            # Copy local to vault
/ingest --delete   # Copy and delete local files
/teleport          # Download from vault
/teleport --delete # Download and delete vault files
```

**Command Features:**

- **Frontmatter Support**: Commands support `description`, `agent`, `model`, and `subtask` fields
- **Argument Placeholders**: Use `$ARGUMENTS`, `$1`, `$2`, etc. for command arguments
- **File References**: Use `@filename` to reference files in the command
- **Shell Integration**: Use `!`command`` to include shell output
- **Automatic Preview**: Commands show dry-run results before executing
- **Error Handling**: Graceful error messages with suggestions

For more examples and advanced usage, see [plugin/README.md](./plugin/README.md#opencode-custom-commands-optional).

### Configuration for Other AI Coding Agents

<details>
<summary><strong>Claude Desktop</strong></summary>

**Config file location:**

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "with-context": {
      "command": "npx",
      "args": ["-y", "with-context-mcp"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "OBSIDIAN_API_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_VAULT": "MyVault",
        "PROJECT_BASE_PATH": "Projects"
      }
    }
  }
}
```

Restart Claude Desktop after editing the config file.

</details>

<details>
<summary><strong>Cline (VS Code Extension)</strong></summary>

1. Open Cline panel in VS Code
2. Click "MCP Servers" icon in top navigation
3. Select "Configure" tab
4. Click "Configure MCP Servers" to open settings file

Add this configuration:

```json
{
  "mcpServers": {
    "with-context": {
      "command": "npx",
      "args": ["-y", "with-context-mcp"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "OBSIDIAN_API_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_VAULT": "MyVault",
        "PROJECT_BASE_PATH": "Projects"
      },
      "alwaysAllow": []
    }
  }
}
```

Restart VS Code after saving the configuration.

</details>

<details>
<summary><strong>Cursor</strong></summary>

Create or edit one of these files:

- **Project-specific:** `.cursor/mcp.json` (in project root)
- **Global:** `~/.cursor/mcp.json` (in home directory)

```json
{
  "mcpServers": {
    "with-context": {
      "command": "npx",
      "args": ["-y", "with-context-mcp"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "OBSIDIAN_API_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_VAULT": "MyVault",
        "PROJECT_BASE_PATH": "Projects"
      }
    }
  }
}
```

Restart Cursor after saving the configuration.

</details>

<details>
<summary><strong>Windsurf</strong></summary>

1. Open Settings (`Cmd/Ctrl + ,`)
2. Navigate to Cascade → Advanced Settings
3. Enable MCP
4. Go to Plugins → Manage Plugins → View raw config
5. Add the following configuration:

```json
{
  "mcpServers": {
    "with-context": {
      "command": "npx",
      "args": ["-y", "with-context-mcp"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "OBSIDIAN_API_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_VAULT": "MyVault",
        "PROJECT_BASE_PATH": "Projects"
      }
    }
  }
}
```

Save and refresh Windsurf.

</details>

<details>
<summary><strong>Continue.dev</strong></summary>

**Note:** MCP servers work only in agent mode.

Create `.continue/mcpServers/with-context.yaml` in your project root:

```yaml
name: WithContext MCP Server
version: 1.0.0
schema: v1
mcpServers:
  - name: with-context
    command: npx
    args:
      - -y
      - with-context-mcp
    env:
      OBSIDIAN_API_KEY: your_api_key_here
      OBSIDIAN_API_URL: https://127.0.0.1:27124
      OBSIDIAN_VAULT: MyVault
      PROJECT_BASE_PATH: Projects
```

Use `@` mentions to trigger MCP resources in the UI.

</details>

<details>
<summary><strong>GitHub Copilot (VS Code 1.102+)</strong></summary>

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Select `MCP: Add Server…`
3. Choose "Local server command"
4. Enter command: `npx`
5. Enter args: `-y with-context-mcp`
6. Choose scope (Global or Workspace)
7. Add environment variables when prompted:
   - `OBSIDIAN_API_KEY=your_api_key_here`
   - `OBSIDIAN_API_URL=https://127.0.0.1:27124`
   - `OBSIDIAN_VAULT=MyVault`
   - `PROJECT_BASE_PATH=Projects`

Or manually edit `mcp.json`:

```json
{
  "servers": {
    "with-context": {
      "command": "npx",
      "args": ["-y", "with-context-mcp"],
      "env": {
        "OBSIDIAN_API_KEY": "your_api_key_here",
        "OBSIDIAN_API_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_VAULT": "MyVault",
        "PROJECT_BASE_PATH": "Projects"
      }
    }
  }
}
```

</details>

## Usage

### Setting Project Context

```javascript
// Set the project folder for this session
set_project_context({
  project_folder: 'my-web-app',
});

// All subsequent operations will use: vault://Projects/my-web-app/
```

### Writing Notes

```javascript
// Write a changelog
write_note({
  path: 'CHANGELOG.md',
  content: '## 2024-01-15\n- Added user auth\n- Fixed bug #123',
  mode: 'append',
});

// Create API documentation
write_note({
  path: 'docs/api/users.md',
  content: '# Users API\n\n## Endpoints...',
  mode: 'create',
});

// Override project folder for this operation
write_note({
  path: 'README.md',
  content: '# Project Docs',
  mode: 'overwrite',
  project_folder: 'other-project',
});
```

## Documentation Delegation with .withcontextignore

The `.withcontextignore` file lets you control which documentation files are delegated to your Obsidian vault. This is useful for:

- Keeping internal documentation local while delegating public docs
- Excluding auto-generated documentation
- Managing work-in-progress or draft documents
- Handling monorepo packages separately

### Creating .withcontextignore

Create a `.withcontextignore` file in your project root:

```bash
# Using the CLI (creates from template)
npx with-context-mcp --create-withcontextignore

# Or create manually
touch .withcontextignore
```

### Pattern Syntax

The `.withcontextignore` file uses glob patterns similar to `.gitignore`:

```gitignore
# Delegate entire directories
docs/

# Delegate all markdown files
*.md

# Negation - keep README in local project
!README.md

# Root-only patterns (only match at project root)
/LICENSE

# Match at any level
**/internal/**

# Directory patterns (matches directory and contents)
build/
dist/
```

### Examples

**Keep internal docs local:**

```gitignore
docs/internal/
docs/private/
**/internal/**
```

**Delegate user guides, keep API docs local:**

```gitignore
# Delegate guides
docs/guides/

# Keep API docs local (negation)
!docs/api/
```

**Monorepo pattern:**

```gitignore
# Keep package-level docs local
packages/*/README.md
packages/*/docs/

# But delegate root docs
!README.md
!CONTRIBUTING.md
```

### CLI Commands

Check which files will be delegated:

```bash
# Check a specific file
npx with-context-mcp --check-delegation docs/guide.md

# Generate full delegation report
npx with-context-mcp --delegation-report

# View cache statistics
npx with-context-mcp --cache-stats

# Clear cache
npx with-context-mcp --cache-clear
```

### Read Strategies

When reading delegated files, you can choose from three strategies:

- **local-first** (default): Try local filesystem first, fallback to vault
- **vault-first**: Try vault first, fallback to local filesystem
- **vault-only**: Only read from vault, fail if not found

Configure via environment variable:

```bash
DELEGATION_STRATEGY=vault-first
```

### How It Works

1. **Write Operations**: When AI writes documentation matching `.withcontextignore` patterns, it's automatically delegated to your vault
2. **Read Operations**: When AI reads delegated files, content is fetched from vault with automatic caching
3. **Caching**: Vault reads are cached (5-minute TTL) for performance
4. **Pattern Matching**: Uses micromatch for powerful glob pattern support

For more examples, see [examples/withcontextignore-examples.md](./examples/withcontextignore-examples.md).

## Syncing Documentation Files

In addition to automatic delegation during AI operations, you can manually sync documentation files between your local project and Obsidian vault using three dedicated tools:

### `ingest_notes` - Project → Vault

Scans your local project for documentation files matching `.withcontextignore` patterns and copies them to your vault.

```javascript
// Preview what would be ingested (dry run)
ingest_notes({
  dry_run: true,
});

// Copy files to vault
ingest_notes({});

// Copy AND delete local files after successful ingestion
ingest_notes({
  delete_local_files: true,
});
```

### `teleport_notes` - Vault → Project

Copies documentation files from your vault back to your local project.

```javascript
// Preview what would be teleported (dry run)
teleport_notes({
  dry_run: true,
});

// Copy files to local project
teleport_notes({});

// Copy AND delete vault files after successful teleport
teleport_notes({
  delete_from_vault: true,
});
```

### `sync_notes` - Bidirectional Sync ⭐

Synchronizes documentation files in both directions:

- Files in local project matching patterns → moved to vault (deleted from local)
- Files in vault matching patterns → moved to local project (deleted from vault)

This is the **recommended** tool for keeping your documentation in sync.

```javascript
// Preview what would be synced (dry run)
sync_notes({
  dry_run: true,
});

// Perform bidirectional sync (moves files, deletes from source)
sync_notes({});
```

**Use Cases:**

- **Initial Setup**: Use `ingest_notes` to move existing docs to your vault
- **Export Docs**: Use `teleport_notes` when you need to publish or share docs from vault
- **Regular Syncing**: Use `sync_notes` to keep vault and project in sync

**Important Notes:**

- All tools respect `.withcontextignore` patterns
- Files are only synced if they match the configured patterns
- Dry run mode (`dry_run: true`) shows what would happen without making changes
- `sync_notes` automatically deletes files from source after successful copy

## Available Tools

- `set_project_context` - Set the project folder for this session
- `write_note` - Write/update notes (create/overwrite/append modes)
- `read_note` - Read note content
- `list_notes` - List files in a folder
- `search_notes` - Search note content
- `delete_note` - Delete notes (requires confirmation)
- `batch_write_notes` - Write multiple notes at once
- `get_note_metadata` - Get word count, tags, headings, frontmatter
- `list_templates` - List all available templates
- `create_from_template` - Create notes from templates
- `ingest_notes` - Copy documentation files from project to vault (optional delete)
- `teleport_notes` - Copy documentation files from vault to project (optional delete)
- `sync_notes` - Bidirectionally sync docs between project and vault (auto-delete from source)

## Folder Structure

Your Obsidian vault will be organized like this:

```
MyVault/
├── Projects/
│   ├── my-web-app/
│   │   ├── CHANGELOG.md
│   │   ├── docs/
│   │   │   ├── api.md
│   │   │   └── setup.md
│   │   └── README.md
│   ├── data-pipeline/
│   │   └── ...
│   └── mobile-app/
│       └── ...
└── (other vault content)
```

## Security

- **Path Validation**: All paths are validated to prevent directory traversal
- **Project Scoping**: Operations are restricted to the configured project folder
- **HTTPS**: Uses secure connection to Obsidian (self-signed cert in dev)

## Distribution

This project is available in two ways:

### 1. MCP Server (npm package)

For use with MCP-compatible AI clients like Claude Desktop, Cline, Cursor, Windsurf, etc.

```bash
# Using npx (recommended)
npx -y with-context-mcp

# Or install globally
npm install -g with-context-mcp
```

**Package:** [with-context-mcp on npm](https://www.npmjs.com/package/with-context-mcp)

### 2. OpenCode Plugin (Single File - No Build Required!)

This project includes an **OpenCode plugin** that provides all 11 MCP tools directly in your OpenCode sessions. The plugin is provided as a single TypeScript file for easy installation.

**Features:**

- All 11 tools available (write, read, search, list, delete, batch, templates, metadata, context)
- 3 optional custom commands (sync, ingest, teleport)
- Automatic project context detection
- Recursive vault scanning
- Template system with 5 built-in templates
- Single file installation - no build step needed

### Installation

1. **Clone and install dependencies:**

```bash
git clone https://github.com/boxpositron/with-context-mcp.git
cd with-context-mcp
npm install  # Required for plugin to work
```

2. **Copy the plugin file:**

```bash
# Create OpenCode plugin directory
mkdir -p ~/.config/opencode/plugin

# Copy the single-file plugin
cp plugin/with-context.ts ~/.config/opencode/plugin/

# Install with-context-mcp package so OpenCode can access it
cd ~/.config/opencode/plugin
npm install with-context-mcp
```

3. **Configure environment variables:**

```bash
export OBSIDIAN_VAULT_PATH="$HOME/Documents/Vault"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_VAULT="YourVaultName"
export PROJECT_BASE_PATH="Projects"
```

4. **Restart OpenCode** - the plugin will be loaded automatically.

5. **Verify installation:**

```typescript
// In OpenCode, run:
with_context_status();
```

See [plugin/README.md](./plugin/README.md) for detailed documentation, custom commands setup, and usage examples.

## Development

```bash
# Build
npm run build

# Watch mode
npm run watch

# Development mode with auto-reload
npm run dev
```

## Troubleshooting

### "Failed to load configuration"

- Check that all required environment variables are set
- Verify your `.env` file exists and is in the project root

### "Connection refused"

- Ensure Obsidian is running
- Verify the Local REST API plugin is enabled
- Check that `OBSIDIAN_API_URL` matches the plugin's configured port

### "Authentication failed"

- Double-check your `OBSIDIAN_API_KEY` from plugin settings
- Ensure there are no extra spaces in the API key

### "Path traversal detected"

- Don't use `../` or absolute paths
- All paths must be relative to the project folder

## License

[MIT](LICENSE)
