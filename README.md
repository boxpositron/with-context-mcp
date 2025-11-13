# WithContext MCP Server

[![npm version](https://badge.fury.io/js/with-context-mcp.svg)](https://www.npmjs.com/package/with-context-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Let your AI coding agents write directly to your note-taking apps.** WithContext provides project-scoped note management for AI agents working with Obsidian, enabling them to create documentation, track changes, and organize knowledge as they code.

## Why WithContext?

Your AI coding agent needs a place to store documentation, meeting notes, and project updates. WithContext gives them direct access to your Obsidian vault with:

- **Automatic Project Scoping** - Each project gets its own folder, no cross-contamination
- **Smart Editing** - Agents can update frontmatter, replace sections, prepend/append content
- **Session Tracking** - Track what changes the agent makes with changelogs and todos
- **Intelligent Organization** - Built-in presets for keeping vaults clean
- **Template System** - Professional templates for consistent documentation

**You set it up once. Your AI agent handles the rest.**

## Quick Setup

### 1. Install Obsidian REST API Plugin

1. Open Obsidian Settings → Community Plugins → Browse
2. Search for **"Local REST API"** and install
3. Enable the plugin and copy your API key

### 2. Install WithContext

```bash
npm install -g with-context-mcp
```

### 3. Configure Your AI Client

Add this to your AI client's MCP configuration:

**OpenCode** (`opencode.jsonc`):

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

**Other Clients:** [Claude Desktop, Cline, Cursor, Windsurf, Continue.dev, GitHub Copilot →](docs/getting-started.md#client-configuration)

### 4. Set Environment Variables

```bash
export OBSIDIAN_API_KEY="your_api_key_here"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_VAULT="MyVault"
export PROJECT_BASE_PATH="Projects"
```

**That's it!** Your AI agent now has access to 33+ tools for managing notes in `MyVault/Projects/`.

## What Your Agent Can Do

Once configured, your AI coding agent can:

- **Create and update documentation** as it writes code
- **Track changes** with automatic changelogs and todos
- **Organize the vault** using intelligent presets
- **Edit YAML frontmatter** to add tags and metadata
- **Search and update existing notes** by content or filename
- **Generate notes from templates** for consistent formatting
- **Replace specific sections** in markdown files by heading

**You don't need to learn the tools.** Your AI agent will use them automatically when it needs to document something, track a change, or organize notes.

## Example Workflow

When your AI agent works on a feature, it might:

1. Start a session: `start_session({ project_folder: 'my-app' })`
2. Create API docs: `write_note({ path: 'docs/api.md', content: '...' })`
3. Track changes: `add_changelog_entry({ type: 'feature', message: 'Add user API' })`
4. Add a todo: `add_todo({ content: 'Write integration tests' })`
5. Update metadata: `update_frontmatter({ path: 'docs/api.md', frontmatter: { status: 'draft' } })`

Your vault automatically stays organized in:

```
MyVault/Projects/my-app/
├── docs/api.md
└── CHANGELOG.md
```

## Documentation

**Setup:** [Installation & Setup](docs/getting-started.md) • [Configuration](docs/configuration.md)

**Reference:** [All Tools](docs/tools/) • [Common Workflows](docs/examples/common-workflows.md) • [Sessions](docs/guides/sessions.md) • [Vault Organization](docs/guides/vault-organization.md)

## What's New in v3.0.6

- **Prepend Mode** - Add content to the beginning of notes
- **update_frontmatter** - Edit YAML frontmatter with merge/replace modes
- **Fuzzy Finding** - Quick file search with match highlighting
- **replace_section** - Edit specific markdown sections by heading

[Full changelog →](CHANGELOG.md)

## Available Tools

Your AI agent has access to **33 tools** across 6 categories:

| Category         | Tools                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **Core**         | write, read, list, search, delete, batch_write, get_metadata           |
| **Editing**      | update_frontmatter, replace_section                                    |
| **Sessions**     | start, pause, resume, end, status, changelog, todos, commit_suggestion |
| **Organization** | analyze_structure, generate_plan, reorganize                           |
| **Config**       | setup, validate, preview, ingest, teleport, sync                       |
| **Templates**    | list_templates, create_from_template                                   |

[Detailed tool documentation →](docs/tools/)

## Troubleshooting

**Connection Issues?**
Ensure Obsidian is running, Local REST API plugin is enabled, and `OBSIDIAN_API_URL` matches the plugin port (default: 27124)

**Authentication Failed?**
Verify `OBSIDIAN_API_KEY` from plugin settings and check for extra spaces

**Path Errors?**
Use relative paths only (no `../` or absolute paths) - all paths are relative to your project folder

[More help →](docs/getting-started.md#troubleshooting)

## Security

- **Project Scoping** - Operations restricted to configured project folders
- **Path Validation** - Prevents directory traversal attacks
- **HTTPS** - Secure connection to Obsidian Local REST API
- **API Key Authentication** - Required for all operations

## Contributing

Contributions welcome! Fork the repository, create a feature branch, add tests, and submit a pull request.

[Contributing guidelines →](CONTRIBUTING.md)

## Links

**npm:** [with-context-mcp](https://www.npmjs.com/package/with-context-mcp) • **GitHub:** [boxpositron/with-context-mcp](https://github.com/boxpositron/with-context-mcp) • **Issues:** [Report bugs or request features](https://github.com/boxpositron/with-context-mcp/issues)

---

**Made for AI coding agents and the humans who work with them** ❤️
