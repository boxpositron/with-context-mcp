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

## Example: What It Looks Like

When your AI agent works on a feature, it might:

1. Start a session: `start_session({ project_folder: 'my-app' })`
2. Create API docs: `write_note({ path: 'docs/api.md', content: '...' })`
3. Track the change: `add_changelog_entry({ type: 'feature', message: 'Add user API' })`
4. Add a todo: `add_todo({ content: 'Write integration tests' })`
5. Update frontmatter: `update_frontmatter({ path: 'docs/api.md', frontmatter: { status: 'draft' } })`

Your vault automatically stays organized in:

```
MyVault/
└── Projects/
    └── my-app/
        ├── docs/
        │   └── api.md
        └── CHANGELOG.md
```

## Documentation

### For Setup

- **[Installation & Setup](docs/getting-started.md)** - Complete setup for all AI clients
- **[Configuration](docs/configuration.md)** - Environment variables and config files

### For Reference

- **[All Tools](docs/tools/)** - Complete reference for all 33 tools
- **[Common Workflows](docs/examples/common-workflows.md)** - Real-world usage examples
- **[Session Management](docs/guides/sessions.md)** - How sessions work
- **[Vault Organization](docs/guides/vault-organization.md)** - Keeping your vault organized

## What's New in v3.0.6

- **Prepend Mode** - Add content to the beginning of notes
- **update_frontmatter** - Edit YAML frontmatter with merge/replace modes
- **Fuzzy Finding** - Quick file search with match highlighting
- **replace_section** - Edit specific markdown sections by heading

See [CHANGELOG.md](CHANGELOG.md) for complete release history.

## Available Tools (33)

Your AI agent has access to these tools:

**Core:** write_note, read_note, list_notes, search_notes, delete_note, batch_write_notes, get_note_metadata

**Editing:** update_frontmatter, replace_section

**Sessions:** start_session, pause_session, resume_session, end_session, get_session_status, add_changelog_entry, get_session_changelog, get_commit_suggestion, add_todo, update_todo, list_todos

**Organization:** analyze_vault_structure, generate_organization_plan, reorganize_notes

**Configuration:** setup_notes, validate_config, preview_delegation, ingest_notes, teleport_notes, sync_notes

**Templates:** list_templates, create_from_template

**Utilities:** set_project_context, health_check

[See detailed tool documentation →](docs/tools/)

## Security

- **Project Scoping** - All operations restricted to configured project folders
- **Path Validation** - Prevents directory traversal attacks
- **HTTPS** - Secure connection to Obsidian Local REST API
- **API Key Authentication** - Required for all operations

## Troubleshooting

**Connection Issues?**

- Ensure Obsidian is running
- Verify Local REST API plugin is enabled
- Check `OBSIDIAN_API_URL` matches plugin port (default: 27124)

**Authentication Failed?**

- Verify `OBSIDIAN_API_KEY` from plugin settings
- Check for extra spaces in the API key

**Path Errors?**

- Use relative paths only (no `../` or absolute paths)
- All paths are relative to your project folder

[More troubleshooting help →](docs/getting-started.md#troubleshooting)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)

## Links

- **npm:** [with-context-mcp](https://www.npmjs.com/package/with-context-mcp)
- **GitHub:** [boxpositron/with-context-mcp](https://github.com/boxpositron/with-context-mcp)
- **Issues:** [Report bugs or request features](https://github.com/boxpositron/with-context-mcp/issues)

---

**Made for AI coding agents and the humans who work with them** ❤️
