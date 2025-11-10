# WithContext MCP Server

[![npm version](https://badge.fury.io/js/with-context-mcp.svg)](https://www.npmjs.com/package/with-context-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for project-scoped note management. Allows AI coding agents to write markdown documentation directly to your note-taking apps with automatic project folder scoping for security.

**Currently supports:** Obsidian (via REST API)  
**Coming soon:** Notion, Apple Notes, and more

## What's New in v3.0.1

- **Bug Fix**: Fixed path resolution issue with Obsidian Local REST API
  - Changed session storage from `.sessions/` to `sessions/` for proper directory listing
  - The Obsidian API filters hidden folders from listings, making `.sessions/` invisible
  - **Migration**: Rename `.sessions` → `sessions` in your vault (one-time only)

See [CHANGELOG.md](CHANGELOG.md) for complete details.

### v3.0.0 Highlights

- **Session Persistence**: Full cross-tool data persistence - todos and changelog survive tool calls
- **Session Management**: Complete lifecycle tracking (start/pause/resume/end) with vault persistence
- **Todo Management**: Track tasks with priorities and status across sessions
- **Changelog Tracking**: Semi-automatic changelog with conventional commit support

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
- **Documentation Delegation**: Control which docs are delegated to vault with `.withcontextconfig.jsonc` (v2.1+)
- **Conflict Resolution**: Handle overlapping patterns with configurable resolution strategies
- **Configuration Tools**: Setup, migrate, validate, and preview delegation decisions
- **Read Interception**: Automatically read delegated docs from vault with caching
- **Bidirectional Sync**: Sync documentation between local project and vault
- **Legacy Support**: Automatic migration from `.withcontextignore` to new config format

## Prerequisites

1. **A supported note-taking app:**
   - **Obsidian** with the **[Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api)** plugin installed (primary backend)
2. **Node.js** 18+

## Setup

### 1. Install Obsidian REST API Plugin

1. Open Obsidian Settings
2. Go to Community Plugins → Browse
3. Search for "Local REST API" ([plugin repository](https://github.com/coddingtonbear/obsidian-local-rest-api))
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

**Available Commands:**

This repository includes pre-built OpenCode commands in [`.opencode/command/`](./.opencode/command/):

- **[`setup-notes.md`](./.opencode/command/setup-notes.md)** - Intelligent project setup that creates `.withcontextignore` and configures `AGENTS.md` with documentation delegation guidelines
- **[`sync-notes.md`](./.opencode/command/sync-notes.md)** - Bidirectional sync that moves files between local project and vault (with dry-run preview)
- **[`ingest-notes.md`](./.opencode/command/ingest-notes.md)** - Copy documentation files from local project to vault (optionally delete local files after)
- **[`teleport-notes.md`](./.opencode/command/teleport-notes.md)** - Download documentation files from vault to local project (optionally delete vault files after)

**Installation:**

Simply copy the command files you want to your project:

```bash
# Create commands directory in your project
mkdir -p .opencode/command

# Copy the commands you want (copy all or pick specific ones)
cp /path/to/with-context-mcp/.opencode/command/*.md .opencode/command/

# Or copy individual commands
cp /path/to/with-context-mcp/.opencode/command/setup-notes.md .opencode/command/
cp /path/to/with-context-mcp/.opencode/command/sync-notes.md .opencode/command/
```

**Usage:**

Once installed, use the commands in OpenCode:

```bash
# In OpenCode, type the command name:
/setup-notes              # Setup .withcontextignore and AGENTS.md
/sync-notes               # Bidirectional sync with dry-run preview
/ingest-notes             # Copy local docs to vault with preview
/ingest-notes --delete    # Copy and delete local files after ingestion
/teleport-notes           # Download docs from vault to local with preview
/teleport-notes --delete  # Download and delete vault files after teleport
```

**Command Details:**

**`/setup-notes`** - Intelligent Project Setup (Updated for v2.1.0)

- Analyzes your project structure (monorepo, library, web app, etc.)
- Creates a customized `.withcontextconfig.jsonc` file with patterns appropriate for your project type
- Automatically migrates legacy `.withcontextignore` files to new format
- Updates `AGENTS.md` with documentation delegation guidelines that teach AI agents:
  - When to use with-context tools vs local filesystem
  - Which files should be delegated to vault vs kept local
  - Best practices for documentation management
  - Common workflows with practical examples
- Creates example folder structure in vault (optional)
- Creates a cohesive system where `.withcontextconfig.jsonc` patterns and agent guidelines work together

**`/sync-notes`** - Bidirectional Sync

- Shows dry-run preview of files that will be moved
- Moves local files matching `.withcontextignore` patterns → vault (deletes from local)
- Moves vault files matching patterns → local (deletes from vault)
- Provides detailed report of all sync operations
- Use this for regular synchronization between vault and project

**`/ingest-notes`** - Local → Vault

- Scans local project for documentation files matching `.withcontextignore` patterns
- Shows dry-run preview before copying
- Copies files to vault
- Optional: `--delete` flag to remove local files after successful ingestion
- Use this for initial setup or moving docs to vault

**`/teleport-notes`** - Vault → Local

- Lists documentation files in vault matching `.withcontextignore` patterns
- Shows dry-run preview before downloading
- Downloads files to local project
- Optional: `--delete` flag to remove vault files after successful download
- Use this when you need to publish or share docs from vault

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

## Documentation Delegation Configuration

### New in v2.1.0: `.withcontextconfig.jsonc`

The `.withcontextconfig.jsonc` file provides fine-grained control over which documentation files are delegated to your Obsidian vault. This is useful for:

- Keeping internal documentation local while delegating public docs
- Excluding auto-generated documentation
- Managing work-in-progress or draft documents
- Handling monorepo packages separately
- Resolving conflicts when files match multiple patterns

### Quick Setup

```bash
# Using the MCP tool (recommended)
setup_notes({
  project_root: '/path/to/project',  // optional, defaults to cwd
  force: false,                       // optional, overwrite existing config
  create_structure: true              // optional, create example vault folders
})

# Or using CLI
npx with-context-mcp --setup
```

### Configuration Format

The `.withcontextconfig.jsonc` file uses this structure:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/boxpositron/with-context-mcp/main/src/config/config-schema.json",
  "version": "2.1",
  "defaultBehavior": "local", // or "vault"
  "vault": [
    // Patterns for files to delegate to vault
    "docs/**/*.md",
    "CHANGELOG.md",
    "guides/**",
    "tutorials/**",
  ],
  "local": [
    // Patterns for files to keep local
    "README.md",
    "AGENTS.md",
    "CONTRIBUTING.md",
    "src/**/*.md",
    "tests/**/*.md",
    "**/*.draft.md",
    "**/*.wip.md",
  ],
  "conflictResolution": "local-wins", // or "vault-wins", "most-specific-wins", "error"
}
```

### Configuration Options

- **`version`** (required): Must be `"2.1"` for current format
- **`defaultBehavior`** (optional, default: `"local"`): What to do with files not matching any patterns
  - `"local"`: Keep in project (recommended for most projects)
  - `"vault"`: Delegate to Obsidian
- **`vault`** (optional, default: `[]`): Glob patterns for files to delegate to vault
- **`local`** (optional, default: `[]`): Glob patterns for files to keep in project
- **`conflictResolution`** (optional, default: `"local-wins"`): How to handle files matching both `vault` and `local` patterns
  - `"local-wins"`: Local patterns take precedence
  - `"vault-wins"`: Vault patterns take precedence
  - `"most-specific-wins"`: Most specific pattern wins (e.g., `docs/api/users.md` beats `docs/**`)
  - `"error"`: Throw error on conflicts

### Pattern Syntax

Uses glob patterns similar to `.gitignore`:

```jsonc
{
  "vault": [
    "docs/", // Delegate entire directory
    "*.md", // All markdown files at any level
    "/LICENSE", // Root-only pattern
    "**/internal/**", // Match at any level
    "guides/**/*.md", // Nested patterns
  ],
  "local": [
    "README.md", // Specific file
    "src/**/*.md", // All markdown in src/
    "**/*.draft.md", // All draft files
  ],
}
```

### Configuration Examples

**Keep internal docs local, delegate user docs:**

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": ["docs/guides/**", "docs/tutorials/**", "CHANGELOG.md"],
  "local": ["docs/internal/**", "docs/api/**", "README.md", "CONTRIBUTING.md"],
}
```

**Monorepo configuration:**

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": [
    "docs/**/*.md", // Root docs go to vault
    "packages/*/CHANGELOG.md", // Package changelogs
  ],
  "local": [
    "packages/*/README.md", // Package READMEs stay local
    "packages/*/docs/**", // Package-specific docs stay local
    "**/internal/**", // All internal docs stay local
  ],
  "conflictResolution": "most-specific-wins",
}
```

### Migration from `.withcontextignore`

If you have a legacy `.withcontextignore` file, use the migration tool:

```javascript
// Using MCP tool
migrate_config({
  project_root: '/path/to/project', // optional
  backup: true, // optional, create backup
  force: false, // optional, overwrite existing
});
```

The migration tool:

1. Reads your `.withcontextignore` patterns
2. Converts them to the new `.withcontextconfig.jsonc` format
3. Preserves your pattern intent (negations become `local` patterns)
4. Creates a backup of the original file
5. Validates the generated configuration

### Configuration Tools

**Setup new configuration:**

```javascript
setup_notes({
  project_root: '/path/to/project',
  force: false,
  create_structure: true,
});
```

**Validate configuration:**

```javascript
validate_config({
  project_root: '/path/to/project',
});
```

**Preview delegation decisions:**

```javascript
preview_delegation({
  project_root: '/path/to/project',
  file_path: 'docs/guide.md', // optional, preview specific file
  show_all: false, // optional, show all files in project
});
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

1. **Write Operations**: When AI writes documentation, the system checks `.withcontextconfig.jsonc` patterns to decide whether to write to vault or local filesystem
2. **Read Operations**: When AI reads delegated files, content is fetched from vault with automatic caching
3. **Caching**: Vault reads are cached (5-minute TTL) for performance
4. **Pattern Matching**: Uses micromatch for powerful glob pattern support with conflict resolution
5. **Conflict Resolution**: Handles overlapping patterns based on your `conflictResolution` setting

### Legacy Support

The `.withcontextignore` format is still supported but deprecated. Existing files will continue to work, but we recommend migrating to `.withcontextconfig.jsonc` for:

- Better control with explicit `vault` and `local` patterns
- Conflict resolution strategies
- JSON schema validation and IDE autocomplete
- Future features and improvements

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

### Core Tools

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

### Documentation Management Tools

- `ingest_notes` - Copy documentation files from project to vault (optional delete)
- `teleport_notes` - Copy documentation files from vault to project (optional delete)
- `sync_notes` - Bidirectionally sync docs between project and vault (auto-delete from source)

### Configuration Tools (New in v2.1.0)

- `setup_notes` - Setup `.withcontextconfig.jsonc` and create vault folder structure
- `migrate_config` - Migrate from legacy `.withcontextignore` to new config format
- `validate_config` - Validate configuration file against schema
- `preview_delegation` - Preview which files will be delegated based on current config

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

# Run tests
npm test

# Run tests once (CI mode)
npm run test:run

# Generate coverage
npm run test:coverage
```

### Publishing

The package is automatically published to npm when a new tag is pushed:

1. **Update version** in `package.json`
2. **Update** `CHANGELOG.md` with release notes
3. **Commit changes**: `git commit -am "chore: release v2.X.X"`
4. **Create tag**: `git tag -a v2.X.X -m "Release v2.X.X"`
5. **Push tag**: `git push origin v2.X.X`

The GitHub Actions workflow will automatically:

- Run tests and build
- Publish to npm with provenance
- Attach release artifacts to GitHub release

**Requirements:**

- `NPM_TOKEN` secret configured in GitHub repository settings
- Valid npm account with publish permissions

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

### "Invalid configuration format"

- Ensure `.withcontextconfig.jsonc` has `"version": "2.1"`
- Validate configuration with `validate_config()` tool
- Check JSON syntax (JSONC allows comments)
- Use `$schema` property for IDE validation and autocomplete

### "Conflicting patterns detected"

- Review your `vault` and `local` patterns for overlaps
- Set `conflictResolution` strategy in config:
  - `"local-wins"`: Local patterns take precedence (recommended)
  - `"vault-wins"`: Vault patterns take precedence
  - `"most-specific-wins"`: Most specific pattern wins
  - `"error"`: Fail on conflicts (strict mode)
- Use `preview_delegation()` to see how files will be handled

### Migration Issues

- If migrating from `.withcontextignore` fails, check pattern syntax
- Use `migrate_config({ backup: true })` to keep original file
- Review generated `.withcontextconfig.jsonc` and adjust as needed
- Legacy `.withcontextignore` files still work but are deprecated

## License

[MIT](LICENSE)
