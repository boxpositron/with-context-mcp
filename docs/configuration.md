# Configuration

Complete guide to configuring with-context-mcp for optimal documentation management.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Configuration File](#configuration-file)
- [Delegation System](#delegation-system)
- [Read Strategies](#read-strategies)
- [Auto-Session Configuration](#auto-session-configuration)
- [Security Settings](#security-settings)
- [Best Practices](#best-practices)

## Environment Variables

### Required Variables

```bash
# Obsidian REST API endpoint
OBSIDIAN_API_URL="https://127.0.0.1:27124"

# Your API key from Obsidian Local REST API plugin settings
OBSIDIAN_API_KEY="your_api_key_here"

# Your vault name (visible in Obsidian sidebar)
OBSIDIAN_VAULT="MyVault"

# Base folder in vault for projects (default: "Projects")
PROJECT_BASE_PATH="Projects"
```

### Optional Variables

```bash
# Delegation strategy (default: "local-first")
# Options: "local-first", "vault-first", "vault-only"
DELEGATION_STRATEGY="local-first"

# Auto-session management (default: true)
WITH_CONTEXT_AUTO_START=true
WITH_CONTEXT_AUTO_TRACK=true
WITH_CONTEXT_PROMPT=true
```

### Setting Environment Variables

**Option 1: `.env` file (Recommended)**

Create a `.env` file in your project root:

```bash
OBSIDIAN_API_KEY=abc123def456
OBSIDIAN_API_URL=https://127.0.0.1:27124
OBSIDIAN_VAULT=MyVault
PROJECT_BASE_PATH=Projects
```

**Option 2: Shell export**

Add to your `.bashrc`, `.zshrc`, or `.profile`:

```bash
export OBSIDIAN_API_KEY="abc123def456"
export OBSIDIAN_API_URL="https://127.0.0.1:27124"
export OBSIDIAN_VAULT="MyVault"
export PROJECT_BASE_PATH="Projects"
```

**Option 3: Client configuration**

Most MCP clients allow setting environment variables in their config files. See [Getting Started](./getting-started.md#client-configuration) for client-specific examples.

## Configuration File

### `.withcontextconfig.jsonc`

The `.withcontextconfig.jsonc` file provides fine-grained control over which documentation files are delegated to your vault.

#### Quick Setup

```bash
# Using the MCP tool (recommended)
setup_notes({
  project_root: '/path/to/project',
  force: false,
  create_structure: true
})

# Or using CLI
npx with-context-mcp --setup
```

#### File Structure

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/boxpositron/with-context-mcp/main/src/config/config-schema.json",
  "version": "2.1",
  "defaultBehavior": "local",
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
  "conflictResolution": "local-wins",
}
```

#### Configuration Options

| Option               | Type     | Default        | Description                                                              |
| -------------------- | -------- | -------------- | ------------------------------------------------------------------------ |
| `version`            | string   | -              | Must be `"2.1"` for current format                                       |
| `defaultBehavior`    | string   | `"local"`      | What to do with files not matching any patterns (`"local"` or `"vault"`) |
| `vault`              | string[] | `[]`           | Glob patterns for files to delegate to vault                             |
| `local`              | string[] | `[]`           | Glob patterns for files to keep in project                               |
| `conflictResolution` | string   | `"local-wins"` | How to handle files matching both arrays                                 |

#### Conflict Resolution Strategies

**`local-wins`** (Recommended)

- Local patterns take precedence over vault patterns
- Safe default for most projects
- Prevents accidental delegation of essential files

**`vault-wins`**

- Vault patterns take precedence over local patterns
- Use when you want aggressive vault delegation

**`most-specific-wins`**

- Most specific pattern wins (e.g., `docs/api/users.md` beats `docs/**`)
- Best for complex pattern hierarchies
- Requires careful pattern design

**`error`**

- Throw error on conflicts
- Strict mode for explicit control
- Forces you to resolve all conflicts

#### Pattern Syntax

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

#### Example 1: Keep Internal Docs Local

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": ["docs/guides/**", "docs/tutorials/**", "CHANGELOG.md"],
  "local": ["docs/internal/**", "docs/api/**", "README.md", "CONTRIBUTING.md"],
}
```

#### Example 2: Monorepo Configuration

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "local",
  "vault": ["docs/**/*.md", "packages/*/CHANGELOG.md"],
  "local": ["packages/*/README.md", "packages/*/docs/**", "**/internal/**"],
  "conflictResolution": "most-specific-wins",
}
```

#### Example 3: Aggressive Vault Delegation

```jsonc
{
  "version": "2.1",
  "defaultBehavior": "vault",
  "vault": ["**/*.md"],
  "local": ["README.md", "LICENSE.md", "CONTRIBUTING.md", ".github/**/*"],
  "conflictResolution": "local-wins",
}
```

## Delegation System

### How It Works

1. **Write Operations**: When AI writes documentation, the system checks `.withcontextconfig.jsonc` patterns to decide whether to write to vault or local filesystem

2. **Read Operations**: When AI reads delegated files, content is fetched from vault with automatic caching

3. **Caching**: Vault reads are cached (5-minute TTL) for performance

4. **Pattern Matching**: Uses micromatch for powerful glob pattern support with conflict resolution

### Configuration Tools

#### Setup Configuration

```javascript
setup_notes({
  project_root: '/path/to/project',
  force: false,
  create_structure: true,
});
```

#### Validate Configuration

```javascript
validate_config({
  project_root: '/path/to/project',
});
```

#### Preview Delegation Decisions

```javascript
preview_delegation({
  project_root: '/path/to/project',
  file_path: 'docs/guide.md',
  show_all: false,
});
```

### Syncing Documentation

#### `ingest_notes` - Project → Vault

Copy documentation files from local project to vault:

```javascript
// Preview
ingest_notes({ dry_run: true });

// Execute
ingest_notes({});

// Copy and delete local files
ingest_notes({ delete_local_files: true });
```

#### `teleport_notes` - Vault → Project

Copy documentation files from vault to local project:

```javascript
// Preview
teleport_notes({ dry_run: true });

// Execute
teleport_notes({});

// Copy and delete vault files
teleport_notes({ delete_from_vault: true });
```

#### `sync_notes` - Bidirectional Sync ⭐

Synchronize documentation in both directions:

```javascript
// Preview
sync_notes({ dry_run: true });

// Execute
sync_notes({});
```

**Behavior:**

- Files in local project matching `vault` patterns → moved to vault (deleted from local)
- Files in vault matching patterns → moved to local project (deleted from vault)

## Read Strategies

Control how delegated files are read:

### `local-first` (Default)

Try local filesystem first, fallback to vault:

```bash
DELEGATION_STRATEGY=local-first
```

**Use when:**

- You want local files to take precedence
- You're migrating from local-only setup
- You want flexibility

### `vault-first`

Try vault first, fallback to local filesystem:

```bash
DELEGATION_STRATEGY=vault-first
```

**Use when:**

- Vault is your primary documentation source
- You want to ensure latest vault content
- You're using vault-centric workflow

### `vault-only`

Only read from vault, fail if not found:

```bash
DELEGATION_STRATEGY=vault-only
```

**Use when:**

- You want strict vault-only access
- You're fully migrated to vault
- You want to prevent local file access

## Auto-Session Configuration

Configure automatic session management for the OpenCode plugin:

```bash
# Auto-start session on first file operation (default: true)
export WITH_CONTEXT_AUTO_START=true

# Auto-track file operations (default: true)
export WITH_CONTEXT_AUTO_TRACK=true

# Prompt user on first file operation (default: true)
export WITH_CONTEXT_PROMPT=true
```

### Configuration Modes

**Fully Automatic (Recommended):**

```bash
WITH_CONTEXT_AUTO_START=true
WITH_CONTEXT_AUTO_TRACK=true
WITH_CONTEXT_PROMPT=true
```

**Manual Control:**

```bash
WITH_CONTEXT_AUTO_START=false
WITH_CONTEXT_AUTO_TRACK=false
WITH_CONTEXT_PROMPT=true
```

**Silent Mode:**

```bash
WITH_CONTEXT_AUTO_START=false
WITH_CONTEXT_AUTO_TRACK=false
WITH_CONTEXT_PROMPT=false
```

See [Auto-Tracking Guide](./guides/auto-tracking.md) for complete documentation.

## Security Settings

### Path Validation

All paths are validated to prevent directory traversal attacks:

- Paths must be relative to project folder
- No `../` or absolute paths allowed
- Operations restricted to configured project folder

### Project Scoping

Each project gets its own isolated folder:

```
MyVault/
└── Projects/
    ├── project-a/
    ├── project-b/
    └── project-c/
```

Projects cannot access each other's files.

### HTTPS Connection

The Obsidian Local REST API uses HTTPS by default:

- Self-signed certificate in development
- Secure connection to localhost
- API key authentication required

## Best Practices

### 1. Use `.env` for Sensitive Data

Never commit API keys to version control:

```bash
# .gitignore
.env
```

### 2. Start with Conservative Delegation

Begin with minimal vault delegation:

```jsonc
{
  "defaultBehavior": "local",
  "vault": ["CHANGELOG.md"],
}
```

Expand as needed.

### 3. Use Conflict Resolution Wisely

- **`local-wins`**: Safe default, prevents accidental delegation
- **`most-specific-wins`**: For complex hierarchies
- **`error`**: For strict control

### 4. Validate Configuration Regularly

```javascript
validate_config({ project_root: '/path/to/project' });
```

Run after editing `.withcontextconfig.jsonc`.

### 5. Preview Before Syncing

Always preview sync operations:

```javascript
sync_notes({ dry_run: true });
```

Review the output before executing.

### 6. Keep Essential Files Local

Always keep these files local:

```jsonc
{
  "local": ["README.md", "LICENSE", "CONTRIBUTING.md", ".github/**/*"],
}
```

### 7. Use Descriptive Project Names

```javascript
set_project_context({
  project_folder: 'my-web-app', // Good
  // Not: 'proj1', 'test', 'temp'
});
```

### 8. Organize by Document Type

Use clear folder structures:

```
Projects/my-web-app/
├── docs/
│   ├── api/
│   ├── guides/
│   └── architecture/
├── meetings/
└── planning/
```

### 9. Cache Awareness

Vault reads are cached for 5 minutes. If you manually edit files in Obsidian, wait 5 minutes or restart the MCP server for changes to be visible.

### 10. Backup Before Major Changes

Before running `sync_notes` or `ingest_notes` with delete flags:

1. Backup your vault (Obsidian settings → Backups)
2. Commit local changes to git
3. Run with `dry_run: true` first
4. Review the preview carefully
5. Execute only after confirmation

## Troubleshooting

### "Invalid configuration format"

- Ensure `.withcontextconfig.jsonc` has `"version": "2.1"`
- Validate with `validate_config()` tool
- Check JSON syntax (JSONC allows comments)
- Use `$schema` property for IDE validation

### "Conflicting patterns detected"

- Review your `vault` and `local` patterns for overlaps
- Set appropriate `conflictResolution` strategy
- Use `preview_delegation()` to see how files will be handled

### "File not found" during sync

- Ensure files exist before syncing
- Check that patterns match actual file paths
- Verify case sensitivity (especially on Linux)
- Use `preview_delegation()` to debug pattern matching

### Configuration Not Loading

- Check file location (must be in project root)
- Verify JSON syntax (use a JSON validator)
- Ensure file is named `.withcontextconfig.jsonc` exactly
- Check file permissions

### Environment Variables Not Working

- Verify variables are set: `echo $OBSIDIAN_API_KEY`
- Check for typos in variable names
- Ensure no extra spaces or quotes
- Restart your shell or AI client after setting variables

## Migration from v2.x

If you're upgrading from an earlier version:

1. The `.withcontextignore` file format has been removed in v3.0.2
2. All delegation decisions now use `.withcontextconfig.jsonc`
3. Run `setup_notes()` to create new configuration
4. Pattern matching is more powerful with explicit `vault` and `local` arrays
5. Conflict resolution strategies provide better control

## Next Steps

- **[Tool Reference](./tools/README.md)** - Explore all available tools
- **[Session Management](./guides/sessions.md)** - Track your development workflow
- **[Vault Organization](./guides/vault-organization.md)** - Organize your vault intelligently
- **[Common Workflows](./examples/common-workflows.md)** - See practical examples

---

**Previous:** [Getting Started](./getting-started.md) ← | **Next:** [Tool Reference](./tools/README.md) →
