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

<details>
<summary><strong>OpenCode</strong></summary>

**Config file location:**

- **All platforms:** `opencode.jsonc` in your project root

OpenCode is an AI coding agent built for the terminal that supports MCP servers through its configuration file. Add the with-context MCP server to your `opencode.jsonc`:

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
