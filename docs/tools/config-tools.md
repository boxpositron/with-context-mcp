# Configuration Tools

Setup, validation, and synchronization tools for project configuration and documentation delegation.

## Table of Contents

- [System Tools](#system-tools)
  - [health_check](#health_check)
  - [set_project_context](#set_project_context)
- [Setup and Validation](#setup-and-validation)
  - [setup_notes](#setup_notes)
  - [validate_config](#validate_config)
  - [preview_delegation](#preview_delegation)
- [Synchronization Tools](#synchronization-tools)
  - [ingest_notes](#ingest_notes)
  - [sync_notes](#sync_notes)
  - [teleport_notes](#teleport_notes)

---

## System Tools

### health_check

Validate environment, configuration, and API connection.

#### Parameters

| Parameter        | Type   | Required | Default     | Description                      |
| ---------------- | ------ | -------- | ----------- | -------------------------------- |
| `project_folder` | string | No       | Auto-detect | Optional project folder to check |

#### Return Value

```json
{
  "success": true,
  "environment": {
    "obsidian_api_url": "https://127.0.0.1:27124",
    "obsidian_vault": "MyVault",
    "project_base_path": "Projects",
    "node_env": "production"
  },
  "api_connection": {
    "status": "connected",
    "vault_accessible": true,
    "response_time_ms": 45
  },
  "project_context": {
    "project_folder": "my-project",
    "vault_path": "Projects/my-project",
    "exists": true
  },
  "recommendations": [],
  "message": "All systems operational"
}
```

#### Examples

**Basic health check:**

```javascript
const health = health_check({});

if (health.success) {
  console.log('✓ All systems operational');
} else {
  console.error('✗ Health check failed');
}
```

**Check specific project:**

```javascript
const health = health_check({
  project_folder: 'my-project',
});

console.log('Project exists:', health.project_context.exists);
console.log('API response time:', health.api_connection.response_time_ms, 'ms');
```

#### Use Cases

- Verify environment setup
- Test API connection
- Validate configuration
- Troubleshoot connection issues
- Check project folder exists

#### Common Issues

**"Connection refused":**

- Ensure Obsidian is running
- Verify Local REST API plugin is enabled
- Check `OBSIDIAN_API_URL` matches plugin port

**"Authentication failed":**

- Verify `OBSIDIAN_API_KEY` is correct
- Check for extra spaces in API key
- Regenerate API key in plugin settings

**"Vault not found":**

- Verify `OBSIDIAN_VAULT` matches vault name
- Check vault name (not path)
- Ensure vault is open in Obsidian

---

### set_project_context

Set the project folder for this session.

#### Parameters

| Parameter        | Type   | Required | Description                  |
| ---------------- | ------ | -------- | ---------------------------- |
| `project_folder` | string | Yes      | Project folder name in vault |

#### Return Value

```json
{
  "success": true,
  "project_folder": "my-project",
  "vault_path": "Projects/my-project",
  "base_path": "Projects",
  "message": "Project context set successfully"
}
```

#### Examples

**Set project context:**

```javascript
set_project_context({
  project_folder: 'my-web-app',
});

// All subsequent operations use: Projects/my-web-app/
```

**Switch project context:**

```javascript
// Work on first project
set_project_context({ project_folder: 'project-a' });
write_note({ path: 'notes.md', content: '...', mode: 'create' });

// Switch to second project
set_project_context({ project_folder: 'project-b' });
write_note({ path: 'notes.md', content: '...', mode: 'create' });
```

#### Use Cases

- Set project folder once for session
- Switch between projects
- Override auto-detected project
- Ensure correct vault path

#### Notes

- Context persists for entire session
- Auto-detection uses git repository or directory name
- Can be overridden per-tool with `project_folder` parameter

---

## Setup and Validation

### setup_notes

⭐ **Intelligent documentation setup** with 4-phase analysis.

#### Parameters

| Parameter          | Type    | Required | Default | Description                      |
| ------------------ | ------- | -------- | ------- | -------------------------------- |
| `project_root`     | string  | No       | cwd     | Absolute path to project root    |
| `force`            | boolean | No       | `false` | Overwrite existing config        |
| `create_structure` | boolean | No       | `true`  | Create recommended vault folders |
| `auto_apply`       | boolean | No       | `false` | Auto-apply recommendations       |

#### 4-Phase Analysis

**Phase 1: Repository Analysis**

- Detects project type (MCP server, library, CLI, monorepo, application)
- Identifies framework (React, Next.js, Express, etc.)
- Catalogs all documentation files

**Phase 2: README Validation**

- Analyzes README completeness (0-100 score)
- Validates all markdown links
- Ensures links won't break when files move
- Checks for essential sections

**Phase 3: Intelligent Recommendations**

- Recommends LOCAL vs VAULT delegation
- Based on Diátaxis framework
- Project type and structure
- Best practices

**Phase 4: Configuration & Setup**

- Creates `.withcontextconfig.jsonc`
- Suggests vault folder structure
- Provides actionable next steps
- Optionally creates folders

#### Return Value

```json
{
  "success": true,
  "config_created": true,
  "config_path": "/path/to/project/.withcontextconfig.jsonc",
  "analysis": {
    "project_type": "mcp-server",
    "framework": "typescript",
    "total_docs": 45,
    "readme_health": 85
  },
  "recommendations": {
    "vault_patterns": ["docs/guides/**", "docs/architecture/**"],
    "local_patterns": ["README.md", "CONTRIBUTING.md", "src/**/*.md"],
    "suggested_folders": ["docs/guides", "docs/architecture", "docs/reference"]
  },
  "next_steps": [
    "Review .withcontextconfig.jsonc",
    "Run validate_config to check configuration",
    "Run preview_delegation to see delegation decisions",
    "Run sync_notes to sync files"
  ]
}
```

#### Examples

**Basic setup:**

```javascript
setup_notes({
  project_root: '/path/to/project',
});
```

**Setup with folder creation:**

```javascript
setup_notes({
  project_root: '/path/to/project',
  create_structure: true,
});
```

**Force overwrite existing config:**

```javascript
setup_notes({
  project_root: '/path/to/project',
  force: true,
});
```

#### Use Cases

- Initial project setup
- Configure documentation delegation
- Analyze documentation health
- Get organization recommendations
- Create vault folder structure

#### Related Tools

- `validate_config` - Validate created config
- `preview_delegation` - Preview delegation decisions
- `sync_notes` - Sync files after setup

---

### validate_config

Validate `.withcontextconfig.jsonc` for errors and warnings.

#### Parameters

| Parameter      | Type   | Required | Default | Description                   |
| -------------- | ------ | -------- | ------- | ----------------------------- |
| `project_root` | string | Yes      | -       | Absolute path to project root |
| `config_path`  | string | No       | Auto    | Optional custom config path   |

#### Return Value

```json
{
  "success": true,
  "valid": true,
  "config_path": "/path/to/project/.withcontextconfig.jsonc",
  "errors": [],
  "warnings": [
    {
      "severity": "warning",
      "message": "Pattern 'docs/**' is very broad",
      "suggestion": "Consider more specific patterns like 'docs/guides/**'"
    }
  ],
  "info": [
    {
      "message": "Using 'local-wins' conflict resolution strategy"
    }
  ],
  "summary": "Configuration is valid with 1 warning"
}
```

#### Examples

**Validate config:**

```javascript
const result = validate_config({
  project_root: '/path/to/project',
});

if (result.valid) {
  console.log('✓ Configuration is valid');
} else {
  console.error('✗ Configuration has errors');
  result.errors.forEach((e) => console.error(e.message));
}
```

**Validate custom config:**

```javascript
validate_config({
  project_root: '/path/to/project',
  config_path: '/path/to/custom-config.jsonc',
});
```

#### Validation Checks

**Schema Validation:**

- Valid JSON/JSONC syntax
- Required fields present
- Correct field types
- Valid version number

**Pattern Validation:**

- Valid glob patterns
- No conflicting patterns
- Patterns match files

**Semantic Validation:**

- Conflict resolution strategy valid
- Default behavior valid
- Patterns are meaningful

#### Use Cases

- Validate after manual config edits
- Check for pattern conflicts
- Verify configuration before syncing
- Troubleshoot delegation issues

---

### preview_delegation

Preview which files will be delegated to vault vs kept local.

#### Parameters

| Parameter        | Type     | Required | Default | Description                        |
| ---------------- | -------- | -------- | ------- | ---------------------------------- |
| `project_root`   | string   | Yes      | -       | Absolute path to project root      |
| `config_path`    | string   | No       | Auto    | Optional custom config path        |
| `show_reasoning` | boolean  | No       | `true`  | Show why each file was categorized |
| `vault_only`     | boolean  | No       | `false` | Show only vault files              |
| `local_only`     | boolean  | No       | `false` | Show only local files              |
| `limit`          | number   | No       | `100`   | Max files to show                  |
| `file_patterns`  | string[] | No       | `[]`    | Filter by file patterns            |
| `specific_files` | string[] | No       | `[]`    | Check specific files               |

#### Return Value

```json
{
  "success": true,
  "config_path": "/path/to/project/.withcontextconfig.jsonc",
  "total_files": 156,
  "vault_files": 89,
  "local_files": 67,
  "files": {
    "vault": [
      {
        "path": "docs/guides/tutorial.md",
        "reason": "Matches vault pattern: docs/guides/**",
        "confidence": 1.0
      }
    ],
    "local": [
      {
        "path": "README.md",
        "reason": "Matches local pattern: README.md",
        "confidence": 1.0
      }
    ]
  },
  "summary": "89 files → vault, 67 files → local"
}
```

#### Examples

**Preview all delegation decisions:**

```javascript
const preview = preview_delegation({
  project_root: '/path/to/project',
});

console.log('Vault files:', preview.vault_files);
console.log('Local files:', preview.local_files);
```

**Preview only vault files:**

```javascript
const preview = preview_delegation({
  project_root: '/path/to/project',
  vault_only: true,
});

preview.files.vault.forEach((f) => {
  console.log(f.path, '-', f.reason);
});
```

**Check specific files:**

```javascript
const preview = preview_delegation({
  project_root: '/path/to/project',
  specific_files: ['docs/api.md', 'README.md'],
});
```

**Preview with limit:**

```javascript
const preview = preview_delegation({
  project_root: '/path/to/project',
  limit: 20,
  show_reasoning: true,
});
```

#### Use Cases

- Test configuration patterns
- Verify delegation decisions
- Debug pattern matching
- Review before syncing
- Check specific files

---

## Synchronization Tools

### ingest_notes

Copy documentation files from local project to vault.

#### Parameters

| Parameter            | Type    | Required | Default | Description                       |
| -------------------- | ------- | -------- | ------- | --------------------------------- |
| `project_folder`     | string  | No       | Auto    | Optional project folder override  |
| `dry_run`            | boolean | No       | `false` | Preview without copying           |
| `delete_local_files` | boolean | No       | `false` | Delete local files after copy     |
| `force_delete`       | boolean | No       | `false` | Force delete without confirmation |

#### Return Value

```json
{
  "success": true,
  "dry_run": false,
  "files_ingested": 45,
  "files_deleted": 0,
  "files": [
    {
      "local_path": "docs/guides/tutorial.md",
      "vault_path": "Projects/my-project/docs/guides/tutorial.md",
      "status": "ingested",
      "size": 12450
    }
  ],
  "total_size": 892000,
  "summary": "Ingested 45 files (892 KB) to vault"
}
```

#### Examples

**Preview ingestion (dry run):**

```javascript
const preview = ingest_notes({
  dry_run: true,
});

console.log('Would ingest:', preview.files_ingested, 'files');
preview.files.forEach((f) => {
  console.log(f.local_path, '→', f.vault_path);
});
```

**Ingest files:**

```javascript
const result = ingest_notes({});

console.log('Ingested:', result.files_ingested, 'files');
```

**Ingest and delete local files:**

```javascript
const result = ingest_notes({
  delete_local_files: true,
});

console.log('Ingested:', result.files_ingested, 'files');
console.log('Deleted:', result.files_deleted, 'local files');
```

#### Use Cases

- Initial project setup
- Move documentation to vault
- Migrate existing docs
- Centralize documentation

#### Notes

- Uses `.withcontextconfig.jsonc` delegation patterns
- Only ingests files matching `vault` patterns
- Preserves folder structure
- Dry run recommended before execution

---

### sync_notes

⭐ **Bidirectional sync** between local project and vault.

#### Parameters

| Parameter        | Type    | Required | Default | Description                      |
| ---------------- | ------- | -------- | ------- | -------------------------------- |
| `project_folder` | string  | No       | Auto    | Optional project folder override |
| `dry_run`        | boolean | No       | `false` | Preview without syncing          |

#### Return Value

```json
{
  "success": true,
  "dry_run": false,
  "to_vault": {
    "count": 12,
    "files": [
      {
        "local_path": "docs/guides/tutorial.md",
        "vault_path": "Projects/my-project/docs/guides/tutorial.md",
        "action": "move",
        "size": 12450
      }
    ]
  },
  "to_local": {
    "count": 3,
    "files": [
      {
        "vault_path": "Projects/my-project/README.md",
        "local_path": "README.md",
        "action": "move",
        "size": 5600
      }
    ]
  },
  "summary": "Synced 12 files → vault, 3 files → local"
}
```

#### Examples

**Preview sync (dry run):**

```javascript
const preview = sync_notes({
  dry_run: true,
});

console.log('To vault:', preview.to_vault.count, 'files');
console.log('To local:', preview.to_local.count, 'files');
```

**Execute sync:**

```javascript
const result = sync_notes({});

console.log('Synced:', result.to_vault.count, '→ vault');
console.log('Synced:', result.to_local.count, '→ local');
```

#### Sync Behavior

**To Vault:**

- Files in local project matching `vault` patterns
- Moved to vault (deleted from local)

**To Local:**

- Files in vault matching patterns
- Moved to local project (deleted from vault)

#### Use Cases

- Regular synchronization
- Keep vault and project in sync
- Apply configuration changes
- Reorganize documentation

#### Notes

- **Recommended tool** for regular syncing
- Automatically deletes from source after copy
- Uses delegation config patterns
- Dry run highly recommended

---

### teleport_notes

Copy documentation files from vault to local project.

#### Parameters

| Parameter           | Type    | Required | Default | Description                       |
| ------------------- | ------- | -------- | ------- | --------------------------------- |
| `project_folder`    | string  | No       | Auto    | Optional project folder override  |
| `dry_run`           | boolean | No       | `false` | Preview without copying           |
| `delete_from_vault` | boolean | No       | `false` | Delete vault files after copy     |
| `force_delete`      | boolean | No       | `false` | Force delete without confirmation |

#### Return Value

```json
{
  "success": true,
  "dry_run": false,
  "files_teleported": 23,
  "files_deleted": 0,
  "files": [
    {
      "vault_path": "Projects/my-project/docs/api.md",
      "local_path": "docs/api.md",
      "status": "teleported",
      "size": 8900
    }
  ],
  "total_size": 456000,
  "summary": "Teleported 23 files (456 KB) to local project"
}
```

#### Examples

**Preview teleport (dry run):**

```javascript
const preview = teleport_notes({
  dry_run: true,
});

console.log('Would teleport:', preview.files_teleported, 'files');
```

**Teleport files:**

```javascript
const result = teleport_notes({});

console.log('Teleported:', result.files_teleported, 'files');
```

**Teleport and delete vault files:**

```javascript
const result = teleport_notes({
  delete_from_vault: true,
});

console.log('Teleported:', result.files_teleported, 'files');
console.log('Deleted:', result.files_deleted, 'vault files');
```

#### Use Cases

- Export documentation from vault
- Publish documentation
- Share documentation
- Backup to local project

#### Notes

- Uses delegation config patterns
- Preserves folder structure
- Dry run recommended before execution
- Opposite of `ingest_notes`

---

## Configuration File Format

### .withcontextconfig.jsonc

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/boxpositron/with-context-mcp/main/src/config/config-schema.json",
  "version": "2.1",
  "defaultBehavior": "local", // or "vault"
  "vault": [
    // Patterns for files to delegate to vault
    "docs/guides/**",
    "docs/architecture/**",
    "CHANGELOG.md",
  ],
  "local": [
    // Patterns for files to keep local
    "README.md",
    "CONTRIBUTING.md",
    "LICENSE",
    "src/**/*.md",
    "tests/**/*.md",
  ],
  "conflictResolution": "local-wins", // or "vault-wins", "most-specific-wins", "error"
}
```

### Configuration Options

**`version`** (required)

- Must be `"2.1"` for current format

**`defaultBehavior`** (optional, default: `"local"`)

- `"local"` - Keep files in project (recommended)
- `"vault"` - Delegate to Obsidian

**`vault`** (optional, default: `[]`)

- Glob patterns for files to delegate to vault

**`local`** (optional, default: `[]`)

- Glob patterns for files to keep in project

**`conflictResolution`** (optional, default: `"local-wins"`)

- `"local-wins"` - Local patterns take precedence
- `"vault-wins"` - Vault patterns take precedence
- `"most-specific-wins"` - Most specific pattern wins
- `"error"` - Throw error on conflicts

### Pattern Syntax

```jsonc
{
  "vault": [
    "docs/", // Entire directory
    "*.md", // All markdown files
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

## Common Workflows

### Workflow 1: New Project Setup

```javascript
// 1. Health check
health_check({ project_folder: 'my-project' });

// 2. Intelligent setup
setup_notes({
  project_root: '/path/to/project',
  create_structure: true,
});

// 3. Validate configuration
validate_config({
  project_root: '/path/to/project',
});

// 4. Preview delegation
preview_delegation({
  project_root: '/path/to/project',
});

// 5. Sync files
sync_notes({ dry_run: true }); // Preview
sync_notes({}); // Execute

// 6. Set context
set_project_context({ project_folder: 'my-project' });
```

### Workflow 2: Regular Synchronization

```javascript
// 1. Preview changes
const preview = sync_notes({ dry_run: true });

console.log('To vault:', preview.to_vault.count);
console.log('To local:', preview.to_local.count);

// 2. Execute if satisfied
if (preview.to_vault.count > 0 || preview.to_local.count > 0) {
  sync_notes({});
}
```

### Workflow 3: Configuration Update

```javascript
// 1. Edit .withcontextconfig.jsonc manually

// 2. Validate changes
const validation = validate_config({
  project_root: '/path/to/project',
});

if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  return;
}

// 3. Preview new delegation
preview_delegation({
  project_root: '/path/to/project',
});

// 4. Sync with new configuration
sync_notes({ dry_run: true }); // Preview
sync_notes({}); // Execute
```

## Best Practices

### Setup

1. **Run health check first** to verify environment
2. **Use setup_notes** for intelligent configuration
3. **Validate config** after manual edits
4. **Preview delegation** before syncing

### Synchronization

1. **Always dry-run first** before syncing
2. **Review preview** carefully
3. **Use sync_notes** for regular syncing
4. **Backup important files** before first sync

### Configuration

1. **Use specific patterns** over broad patterns
2. **Test patterns** with preview_delegation
3. **Document pattern decisions** in config comments
4. **Use appropriate conflict resolution** strategy

## Troubleshooting

### Configuration Issues

**"Invalid configuration format":**

- Ensure `"version": "2.1"`
- Validate JSON syntax
- Use `validate_config` tool

**"Conflicting patterns detected":**

- Review `vault` and `local` patterns
- Set `conflictResolution` strategy
- Use `preview_delegation` to debug

**"Pattern not matching files":**

- Test with `preview_delegation`
- Check glob pattern syntax
- Verify file paths are correct

### Sync Issues

**"Files not syncing":**

- Verify files match delegation patterns
- Check `.withcontextconfig.jsonc` exists
- Run `preview_delegation` to debug
- Ensure files exist in source location

**"Unexpected files synced":**

- Review delegation patterns
- Check `defaultBehavior` setting
- Use more specific patterns
- Test with `dry_run: true`

## Related Documentation

- [Configuration Guide](../configuration.md) - Detailed configuration documentation
- [Getting Started](../getting-started.md) - Quick start guide
- [Core Tools](./core-tools.md) - Basic note operations
