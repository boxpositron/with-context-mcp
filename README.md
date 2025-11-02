# WithContext MCP Server

MCP server for project-scoped note management. Allows AI coding agents to write markdown documentation directly to your note-taking apps with automatic project folder scoping for security.

**Currently supports:** Obsidian (via REST API)  
**Coming soon:** Notion, Apple Notes, and more

## Features

- **Project-Scoped Access**: Each project gets its own folder within your vault
- **Session Context**: Set project once, use across multiple operations
- **Security**: Path validation prevents directory traversal attacks
- **Multiple Write Modes**: Create, overwrite, or append to notes
- **Template System**: Professional templates with variable substitution
- **Batch Operations**: Write multiple notes at once
- **Metadata Extraction**: Get word count, tags, headings, frontmatter

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

Add to your MCP client configuration (e.g., Claude Desktop):

**Using npx (recommended - no installation needed):**

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

**Using local installation:**

```bash
npm install -g with-context-mcp
```

```json
{
  "mcpServers": {
    "with-context": {
      "command": "with-context-mcp",
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

**Configuration values:**

- `OBSIDIAN_API_KEY`: From Obsidian Settings → Local REST API
- `OBSIDIAN_VAULT`: Your vault name (visible in Obsidian sidebar)
- `PROJECT_BASE_PATH`: Folder in vault where projects live (default: "Projects")

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

## OpenCode Plugin

This project includes an **OpenCode plugin** that enhances the MCP experience with:

- Welcome messages showing available templates
- Success notifications for note operations
- Error feedback for troubleshooting
- Real-time confirmation of project context changes

The plugin is **optional but recommended** for the best experience.

### Enable the Plugin

The plugin is located in `.opencode/plugin/` and is already configured in `opencode.jsonc`. Simply ensure OpenCode is installed and start a session in this project directory.

See [Plugin README](.opencode/plugin/README.md) for detailed documentation.

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

MIT
