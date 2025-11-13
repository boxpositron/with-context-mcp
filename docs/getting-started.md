# Getting Started

Complete installation and setup guide for with-context-mcp.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Obsidian Setup](#obsidian-setup)
- [Client Configuration](#client-configuration)
  - [OpenCode (Recommended)](#opencode-recommended)
  - [Claude Desktop](#claude-desktop)
  - [Cline (VS Code)](#cline-vs-code)
  - [Cursor](#cursor)
  - [Windsurf](#windsurf)
  - [Continue.dev](#continuedev)
  - [GitHub Copilot](#github-copilot)
- [First Steps](#first-steps)
- [Verification](#verification)
- [Next Steps](#next-steps)

## Prerequisites

Before installing with-context-mcp, ensure you have:

1. **Node.js 18+** - [Download here](https://nodejs.org)
2. **A supported note-taking app:**
   - **Obsidian** with [Local REST API](https://github.com/coddingtonbear/obsidian-local-rest-api) plugin (primary backend)
   - More backends coming soon (Notion, Apple Notes)
3. **An MCP-compatible AI client:**
   - OpenCode (recommended)
   - Claude Desktop
   - Cline, Cursor, Windsurf, Continue.dev, or GitHub Copilot

## Installation

### Option 1: Using npx (No Installation)

```bash
# Run directly without installation
npx -y with-context-mcp
```

This is the recommended approach for most users. The package will be downloaded and executed on-demand.

### Option 2: Global Installation

```bash
# Install globally
npm install -g with-context-mcp

# Verify installation
with-context-mcp --version
```

Use this if you prefer having the package installed permanently.

## Obsidian Setup

### 1. Install Local REST API Plugin

1. Open Obsidian Settings
2. Navigate to **Community Plugins** → **Browse**
3. Search for **"Local REST API"**
4. Click **Install** and **Enable**
5. Go to plugin settings and copy your **API key**

### 2. Configure Plugin Settings

In the Local REST API plugin settings:

- **API Key**: Copy this for later use
- **Port**: Default is `27124` (note this down)
- **Enable HTTPS**: Recommended (uses self-signed certificate)
- **Enable CORS**: Enable if using web-based clients

### 3. Note Your Vault Name

Your vault name is visible in the Obsidian sidebar. You'll need this for configuration.

## Client Configuration

Choose your AI client and follow the appropriate setup instructions.

### OpenCode (Recommended)

OpenCode is an AI coding agent built for the terminal with excellent MCP server support.

#### Configuration File Location

- **All platforms:** `opencode.jsonc` in your project root

#### Setup Steps

1. **Create or edit `opencode.jsonc`:**

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

2. **Set environment variables:**

Create a `.env` file in your project root or set in your shell:

```bash
export OBSIDIAN_API_KEY="your_api_key_here"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_VAULT="YourVaultName"
export PROJECT_BASE_PATH="Projects"
```

3. **Restart OpenCode**

#### Usage Tips

**Mention the server in prompts:**

```
Use the with-context MCP server to create a CHANGELOG.md for this project
```

**Add rules to AGENTS.md:**

```markdown
## Documentation Guidelines

- Use the with-context MCP server for all project documentation
- Create changelogs in CHANGELOG.md using append mode
- Store API docs in docs/api/ folder
- Always set project context before writing notes
```

**Verify server is loaded:**

```
Loaded MCP server: with-context
```

#### OpenCode Custom Commands

This repository includes pre-built OpenCode commands in `.opencode/command/`:

- `setup-notes.md` - Intelligent project setup
- `validate-notes-config.md` - Validate configuration
- `preview-notes-delegation.md` - Preview delegation decisions
- `sync-notes.md` - Bidirectional sync
- `ingest-notes.md` - Copy docs to vault
- `teleport-notes.md` - Download docs from vault

**Installation:**

```bash
# Create commands directory in your project
mkdir -p .opencode/command

# Copy commands
cp /path/to/with-context-mcp/.opencode/command/*.md .opencode/command/
```

**Usage:**

```bash
# In OpenCode
/setup-notes
/sync-notes
/validate-notes-config
```

### Claude Desktop

#### Configuration File Location

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

#### Setup Steps

1. **Edit the configuration file:**

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

2. **Replace placeholder values:**
   - `your_api_key_here` → Your Obsidian API key
   - `MyVault` → Your vault name
   - `Projects` → Your preferred base folder

3. **Restart Claude Desktop**

### Cline (VS Code)

#### Setup Steps

1. Open Cline panel in VS Code
2. Click **MCP Servers** icon in top navigation
3. Select **Configure** tab
4. Click **Configure MCP Servers** to open settings file

5. **Add configuration:**

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

6. **Restart VS Code**

### Cursor

#### Configuration File Location

- **Project-specific:** `.cursor/mcp.json` (in project root)
- **Global:** `~/.cursor/mcp.json` (in home directory)

#### Setup Steps

1. **Create or edit the configuration file:**

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

2. **Restart Cursor**

### Windsurf

#### Setup Steps

1. Open Settings (`Cmd/Ctrl + ,`)
2. Navigate to **Cascade** → **Advanced Settings**
3. Enable **MCP**
4. Go to **Plugins** → **Manage Plugins** → **View raw config**

5. **Add configuration:**

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

6. **Save and refresh Windsurf**

### Continue.dev

**Note:** MCP servers work only in agent mode.

#### Setup Steps

1. **Create `.continue/mcpServers/with-context.yaml` in your project root:**

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

2. **Use `@` mentions to trigger MCP resources in the UI**

### GitHub Copilot

**Requirements:** VS Code 1.102+

#### Setup Steps

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Select **MCP: Add Server…**
3. Choose **"Local server command"**
4. Enter command: `npx`
5. Enter args: `-y with-context-mcp`
6. Choose scope (Global or Workspace)
7. Add environment variables when prompted:
   - `OBSIDIAN_API_KEY=your_api_key_here`
   - `OBSIDIAN_API_URL=https://127.0.0.1:27124`
   - `OBSIDIAN_VAULT=MyVault`
   - `PROJECT_BASE_PATH=Projects`

**Or manually edit `mcp.json`:**

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

## First Steps

### 1. Set Project Context

Before writing any notes, set the project context:

```javascript
set_project_context({
  project_folder: 'my-web-app',
});
```

This creates a folder structure in your vault:

```
MyVault/
└── Projects/
    └── my-web-app/
```

### 2. Create Your First Note

```javascript
write_note({
  path: 'README.md',
  content: '# My Web App\n\nProject documentation.',
  mode: 'create',
});
```

### 3. List Notes

```javascript
list_notes({
  path: '', // List root folder
});
```

### 4. Read a Note

```javascript
read_note({
  path: 'README.md',
});
```

## Verification

### Check Server Connection

In your AI client, try:

```javascript
// List available tools
// You should see tools like:
// - write_note
// - read_note
// - list_notes
// - set_project_context
// etc.
```

### Test Basic Operations

```javascript
// 1. Set context
set_project_context({ project_folder: 'test-project' });

// 2. Write a test note
write_note({
  path: 'test.md',
  content: '# Test\n\nThis is a test note.',
  mode: 'create',
});

// 3. Read it back
read_note({ path: 'test.md' });

// 4. Delete it
delete_note({ path: 'test.md', confirm: true });
```

### Verify in Obsidian

1. Open Obsidian
2. Navigate to `Projects/test-project/`
3. You should see the notes you created

## Next Steps

Now that you're set up, explore the features:

1. **[Configuration Guide](./configuration.md)** - Learn about `.withcontextconfig.jsonc` and delegation
2. **[Tool Reference](./tools/README.md)** - Explore all available tools
3. **[Session Management](./guides/sessions.md)** - Track your development workflow
4. **[Vault Organization](./guides/vault-organization.md)** - Organize your vault intelligently
5. **[Common Workflows](./examples/common-workflows.md)** - See practical examples

## Troubleshooting

### "Failed to load configuration"

- Check that all environment variables are set correctly
- Verify your `.env` file exists and is in the project root
- Ensure no extra spaces in values

### "Connection refused"

- Ensure Obsidian is running
- Verify the Local REST API plugin is enabled
- Check that `OBSIDIAN_API_URL` matches the plugin's configured port (default: 27124)

### "Authentication failed"

- Double-check your `OBSIDIAN_API_KEY` from plugin settings
- Ensure there are no extra spaces or quotes in the API key
- Try regenerating the API key in Obsidian

### "Path traversal detected"

- Don't use `../` or absolute paths
- All paths must be relative to the project folder
- Example: `docs/api.md` not `/docs/api.md` or `../docs/api.md`

### Server Not Loading

**OpenCode:**

- Verify `opencode.jsonc` is valid JSON/JSONC
- Check that all environment variables are properly quoted strings
- Restart OpenCode after modifying configuration

**Claude Desktop:**

- Verify configuration file location is correct for your OS
- Check JSON syntax (no trailing commas)
- Restart Claude Desktop

**Other Clients:**

- Check client-specific documentation
- Verify MCP support is enabled
- Review client logs for errors

## Getting Help

If you encounter issues not covered here:

1. **Check the [Troubleshooting Guide](../README.md#troubleshooting)**
2. **Review [Common Workflows](./examples/common-workflows.md)** for usage patterns
3. **Open an issue** on [GitHub](https://github.com/boxpositron/with-context-mcp/issues)
4. **Include:**
   - Your OS and Node.js version
   - AI client and version
   - Error messages and stack traces
   - Steps to reproduce

---

**Next:** [Configuration Guide](./configuration.md) →
