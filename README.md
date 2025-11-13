# WithContext MCP Server

[![npm version](https://badge.fury.io/js/with-context-mcp.svg)](https://www.npmjs.com/package/with-context-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Project-scoped note management for AI coding agents.** Write markdown documentation directly to your note-taking apps (Obsidian, Notion, Apple Notes) with automatic project folder scoping, intelligent organization, and session tracking.

## Features

- **🔒 Project-Scoped Access** - Each project gets its own isolated folder within your vault
- **📝 Multiple Write Modes** - Create, overwrite, append, or prepend to notes
- **🎯 Smart Editing** - Edit YAML frontmatter and replace specific sections by heading
- **🔍 Fuzzy Search** - Find files quickly with intelligent matching and highlighting
- **📋 Template System** - Professional templates with variable substitution
- **📊 Session Management** - Track development workflow with changelog and todos
- **🗂️ Vault Organization** - Intelligent analysis and automated reorganization with 4 built-in presets
- **⚙️ Documentation Delegation** - Control which docs stay local vs. vault with `.withcontextconfig.jsonc`

## Quick Start

### 1. Install Obsidian REST API Plugin

1. Open Obsidian Settings → Community Plugins → Browse
2. Search for **"Local REST API"** and install
3. Enable the plugin and copy your API key

### 2. Install with-context-mcp

```bash
# Using npx (no installation needed)
npx -y with-context-mcp

# Or install globally
npm install -g with-context-mcp
```

### 3. Configure Your AI Client

**OpenCode (Recommended):**

Create `opencode.jsonc` in your project root:

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

Set environment variables:

```bash
export OBSIDIAN_API_KEY="your_api_key_here"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_VAULT="MyVault"
export PROJECT_BASE_PATH="Projects"
```

**Other Clients:** See [Getting Started Guide](docs/getting-started.md#client-configuration) for Claude Desktop, Cline, Cursor, Windsurf, Continue.dev, and GitHub Copilot.

### 4. Set Project Context

```javascript
set_project_context({
  project_folder: 'my-web-app',
});
```

### 5. Start Writing Notes

```javascript
write_note({
  path: 'CHANGELOG.md',
  content: '## 2024-01-15\n- Added user authentication\n- Fixed bug #123',
  mode: 'append',
});
```

**That's it!** Your notes are now in `MyVault/Projects/my-web-app/`.

## Documentation

### Getting Started

- **[Installation & Setup](docs/getting-started.md)** - Complete installation guide for all clients
- **[Configuration](docs/configuration.md)** - Environment variables, config files, and delegation

### Tool Reference

- **[Core Tools](docs/tools/core-tools.md)** - write, read, list, search, delete, batch, metadata
- **[Editing Tools](docs/tools/editing-tools.md)** - update_frontmatter, replace_section
- **[Session Tools](docs/tools/session-tools.md)** - Session lifecycle, changelog, todos
- **[Vault Tools](docs/tools/vault-tools.md)** - Vault organization, presets, analysis
- **[Config Tools](docs/tools/config-tools.md)** - setup, validate, preview, sync

### Guides

- **[Session Management](docs/guides/sessions.md)** - Track your development workflow
- **[Vault Organization](docs/guides/vault-organization.md)** - Intelligent vault organization
- **[Vault Presets](docs/guides/vault-presets.md)** - 4 built-in organization strategies
- **[Auto-Tracking](docs/guides/auto-tracking.md)** - Automatic session management (OpenCode plugin)
- **[Templates](docs/guides/templates.md)** - Template system and customization

### Examples & Reference

- **[Common Workflows](docs/examples/common-workflows.md)** - Real-world usage patterns
- **[API Reference](docs/api/tool-reference.md)** - Complete tool API documentation

## What's New

### v3.0.6 (Latest)

- **Prepend Mode** - Add content to the beginning of notes
- **update_frontmatter Tool** - Edit YAML frontmatter with merge/replace modes
- **Fuzzy Finding** - Search files by name with match highlighting
- **replace_section Tool** - Targeted section editing with three replacement modes

### v3.0.5

- **Vault Organization Presets** ⭐ NEW - 4 built-in presets (clean, minimal, docs-as-code, research)
- **generate_organization_plan Tool** - Intelligent organization plans using presets
- **Auto-Session Management** - Automatic project detection and session tracking (OpenCode plugin)

### v3.0.2

- **Config System Unification** - Removed `.withcontextignore` in favor of `.withcontextconfig.jsonc`
- **Improved Delegation** - Better pattern matching and conflict resolution
- **Bidirectional Sync** - `sync_notes`, `ingest_notes`, `teleport_notes` now use delegation config

See [CHANGELOG.md](CHANGELOG.md) for complete release history.

## Available Tools

### Core Tools

- `set_project_context` - Set project folder for this session
- `write_note` - Write/update notes (create/overwrite/append/prepend)
- `read_note` - Read note content
- `list_notes` - List files with optional fuzzy search
- `search_notes` - Search note content
- `delete_note` - Delete notes (requires confirmation)
- `batch_write_notes` - Write multiple notes at once
- `get_note_metadata` - Get word count, tags, headings, frontmatter

### Editing Tools

- `update_frontmatter` - Edit YAML frontmatter (merge/replace modes)
- `replace_section` - Replace markdown sections by heading

### Session Tools

- `start_session`, `pause_session`, `resume_session`, `end_session` - Session lifecycle
- `get_session_status` - Get current session details
- `add_changelog_entry` - Track changes with conventional commit types
- `get_session_changelog` - View session changelog
- `get_commit_suggestion` - Generate conventional commit messages
- `add_todo`, `update_todo`, `list_todos` - Todo management

### Vault Organization Tools

- `analyze_vault_structure` - Analyze vault content and relationships
- `generate_organization_plan` - Generate plans using presets (clean, minimal, docs-as-code, research)
- `reorganize_notes` - Execute reorganization with link updates and rollback

### Configuration Tools

- `setup_notes` - Intelligent project setup with `.withcontextconfig.jsonc`
- `validate_config` - Validate configuration file
- `preview_delegation` - Preview delegation decisions
- `ingest_notes` - Copy docs from project to vault
- `teleport_notes` - Copy docs from vault to project
- `sync_notes` - Bidirectional sync between project and vault

### Template Tools

- `list_templates` - List available templates
- `create_from_template` - Create notes from templates

## Example Usage

### Basic Note Management

```javascript
// Set project context
set_project_context({ project_folder: 'my-web-app' });

// Create a new note
write_note({
  path: 'docs/api.md',
  content: '# API Documentation\n\n## Endpoints...',
  mode: 'create',
});

// Update frontmatter
update_frontmatter({
  path: 'docs/api.md',
  frontmatter: {
    tags: ['api', 'documentation'],
    version: '1.0.0',
  },
  mode: 'merge',
});

// Replace a section
replace_section({
  path: 'docs/api.md',
  heading: 'Authentication',
  content: 'Updated authentication details...',
  mode: 'content-only',
});
```

### Session Management

```javascript
// Start a session
start_session({
  project_folder: 'my-web-app',
  message: 'Implementing user authentication',
});

// Track changes
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts', 'src/middleware.ts'],
});

// Add todos
add_todo({
  content: 'Write integration tests for auth',
  priority: 'high',
});

// Generate commit message
get_commit_suggestion({});
// Returns: "feat: add JWT authentication"

// End session
end_session({
  message: 'Authentication complete',
});
```

### Vault Organization

```javascript
// Generate organization plan using clean preset
const plan = await generate_organization_plan({
  project_folder: 'my-web-app',
  preset_id: 'clean',
  min_confidence: 0.7,
});

// Preview reorganization
const preview = await reorganize_notes({
  plan: plan.plan,
  dry_run: true,
});

// Execute (after reviewing preview)
const result = await reorganize_notes({
  plan: plan.plan,
  dry_run: false,
  update_links: true,
  create_backup: true,
});
```

## Folder Structure

Your Obsidian vault will be organized like this:

```
MyVault/
├── Projects/
│   ├── my-web-app/
│   │   ├── CHANGELOG.md
│   │   ├── docs/
│   │   │   ├── api.md
│   │   │   └── guides/
│   │   ├── meetings/
│   │   └── planning/
│   ├── data-pipeline/
│   └── mobile-app/
└── (other vault content)
```

## OpenCode Plugin

This project includes an **OpenCode plugin** that provides all MCP tools directly in your OpenCode sessions. The plugin is a single TypeScript file for easy installation.

**Installation:**

```bash
# Copy plugin file
mkdir -p ~/.config/opencode/plugin
cp plugin/with-context.ts ~/.config/opencode/plugin/

# Install dependencies
cd ~/.config/opencode/plugin
npm install with-context-mcp
```

**Features:**

- All 30+ tools available
- Automatic project context detection
- Template system with 5 built-in templates
- Single file installation - no build step needed

See [plugin/README.md](./plugin/README.md) for detailed documentation.

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

## Publishing

The package is automatically published to npm when a new tag is pushed:

```bash
# Update version in package.json
npm version patch  # or minor, major

# Update CHANGELOG.md

# Commit and tag
git commit -am "chore: release v3.0.7"
git tag -a v3.0.7 -m "Release v3.0.7"
git push origin v3.0.7
```

GitHub Actions will automatically:

- Run tests and build
- Publish to npm with provenance
- Attach release artifacts to GitHub release

## Troubleshooting

### Common Issues

**"Connection refused"**

- Ensure Obsidian is running
- Verify Local REST API plugin is enabled
- Check `OBSIDIAN_API_URL` matches plugin port (default: 27124)

**"Authentication failed"**

- Double-check `OBSIDIAN_API_KEY` from plugin settings
- Ensure no extra spaces in the API key

**"Path traversal detected"**

- Don't use `../` or absolute paths
- All paths must be relative to project folder

**"Invalid configuration format"**

- Ensure `.withcontextconfig.jsonc` has `"version": "2.1"`
- Validate with `validate_config()` tool
- Check JSON syntax (JSONC allows comments)

See [Getting Started Guide](docs/getting-started.md#troubleshooting) for more troubleshooting help.

## Security

- **Path Validation** - All paths validated to prevent directory traversal
- **Project Scoping** - Operations restricted to configured project folder
- **HTTPS** - Secure connection to Obsidian (self-signed cert in dev)
- **API Key Authentication** - Required for all Obsidian API calls

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

[MIT](LICENSE)

## Links

- **npm Package:** [with-context-mcp](https://www.npmjs.com/package/with-context-mcp)
- **GitHub Repository:** [boxpositron/with-context-mcp](https://github.com/boxpositron/with-context-mcp)
- **Issues:** [GitHub Issues](https://github.com/boxpositron/with-context-mcp/issues)
- **Obsidian Local REST API:** [Plugin Repository](https://github.com/coddingtonbear/obsidian-local-rest-api)

---

**Made with ❤️ for AI coding agents and knowledge workers**
