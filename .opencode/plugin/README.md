# WithContext OpenCode Plugin

An OpenCode plugin that enhances the WithContext MCP server experience with real-time feedback and helpful notifications.

## Features

### 🎯 Session Welcome

When you start an OpenCode session, the plugin automatically:

- Displays a welcome message
- Lists all available MCP commands
- Shows available note templates

### ✅ Operation Feedback

Get instant feedback for note operations:

- **write_note**: Confirms when notes are saved or updated
- **set_project_context**: Shows which project context is active
- **delete_note**: Confirms note deletion
- **batch_write_notes**: Reports how many notes were saved
- **create_from_template**: Shows template usage

### ❌ Error Handling

Clear error messages when operations fail, helping you quickly identify and fix issues.

## Installation

The plugin is automatically loaded from the `.opencode/plugin/` directory when OpenCode starts.

### Enable the Plugin

Add to your `opencode.jsonc`:

```json
{
  "plugins": {
    "with-context": {
      "enabled": true
    }
  }
}
```

### Disable the Plugin

Set `enabled` to `false` or remove the plugin configuration:

```json
{
  "plugins": {
    "with-context": {
      "enabled": false
    }
  }
}
```

## How It Works

The plugin listens to OpenCode events and tool executions:

1. **Session Events**: Triggers on `session.started` to show welcome messages
2. **Tool Success**: Hooks into `tool.execute.after` to show success notifications
3. **Tool Errors**: Hooks into `tool.execute.error` to display helpful error messages

## Benefits

### Better User Experience

- Know immediately when operations succeed or fail
- Discover available templates without memorizing commands
- Get visual confirmation of project context changes

### Faster Workflow

- No need to check Obsidian to verify notes were saved
- Quick feedback helps you maintain flow state
- Error messages help you fix issues faster

### Learning Aid

- Session welcome messages remind you of available commands
- Template listings help you discover and use templates
- Success messages reinforce correct usage patterns

## Example Output

```
📝 WithContext MCP is ready!

Available commands:
• set_project_context - Set your project folder
• write_note - Create/update notes
• create_from_template - Use templates

3 templates available:
• changelog: Professional changelog template
• meeting-notes: Meeting notes with attendees and action items
• project-readme: Project documentation template
```

```
✅ Note saved: CHANGELOG.md
```

```
📁 Project context set to: my-web-app
```

## Customization

The plugin source is available at `.opencode/plugin/with-context.js`. You can:

- Modify notification messages
- Add new tool hooks
- Customize the welcome message
- Add notifications for other MCP tools

## Documentation Delegation

The plugin includes support for documentation delegation via `.withcontextignore`:

### Write Delegation

When you write documentation files, the plugin:

- Checks if files match `.withcontextignore` patterns
- Automatically delegates matching files to your vault
- Provides feedback about delegation decisions
- Handles pattern updates dynamically

### Read Interception

When reading delegated documentation:

- Automatically fetches content from vault
- Caches reads for performance (5-minute TTL)
- Falls back based on strategy (local-first/vault-first/vault-only)
- Formats content with line numbers like OpenCode's read tool

### Using .withcontextignore

Create a `.withcontextignore` file in your project root to control delegation:

```gitignore
# Delegate docs directory
docs/

# Keep internal docs local
!docs/internal/

# Delegate all markdown
*.md

# Keep README local
!README.md
```

Check delegation with CLI commands:

```bash
# Check specific file
npx with-context-mcp --check-delegation docs/guide.md

# View full report
npx with-context-mcp --delegation-report

# Cache management
npx with-context-mcp --cache-stats
npx with-context-mcp --cache-clear
```

### How Delegation Works

1. **Write**: AI writes to `docs/guide.md`
2. **Pattern Check**: Matches `docs/` pattern in `.withcontextignore`
3. **Delegation**: File is written to vault at `Projects/my-project/docs/guide.md`
4. **Read**: Later reads automatically fetch from vault (with caching)

### Read Strategies

Configure via `DELEGATION_STRATEGY` environment variable:

- `local-first` (default): Try local, fallback to vault
- `vault-first`: Try vault, fallback to local
- `vault-only`: Only vault, fail if not found

Example:

```jsonc
{
  "mcp": {
    "with-context": {
      "environment": {
        "DELEGATION_STRATEGY": "vault-first",
      },
    },
  },
}
```

## Troubleshooting

### Plugin not loading

- Ensure the file is at `.opencode/plugin/with-context.js`
- Check that `opencode.jsonc` has the plugin enabled
- Restart your OpenCode session

### No notifications appearing

- Verify the MCP server name matches `with-context` in your config
- Check OpenCode logs for error messages
- Ensure tool names match exactly (case-sensitive)

### Delegation not working

- Verify `.withcontextignore` exists in project root
- Check pattern syntax using `--check-delegation <file>`
- Run `--delegation-report` to see which files are affected
- Ensure file extensions match (`.md`, `.txt`, `.rst`, `.adoc`)

### Cache issues

- Clear cache: `npx with-context-mcp --cache-clear`
- Check stats: `npx with-context-mcp --cache-stats`
- Cache TTL is 5 minutes by default

## Learn More

- [OpenCode Plugin Documentation](https://opencode.ai/docs/plugins)
- [WithContext MCP Server](../README.md)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
