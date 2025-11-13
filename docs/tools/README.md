# Tool Documentation

Comprehensive documentation for all with-context-mcp tools organized by category.

## Tool Categories

### [Core Tools](./core-tools.md)

Essential tools for reading, writing, and managing notes in your Obsidian vault.

**Tools:**

- `write_note` - Write notes with create/overwrite/append/prepend modes
- `read_note` - Read note content from vault
- `list_notes` - List files with fuzzy search support
- `search_notes` - Search note content
- `get_note_metadata` - Extract metadata, tags, headings, frontmatter
- `delete_note` - Delete notes with confirmation
- `batch_write_notes` - Write multiple notes at once

### [Editing Tools](./editing-tools.md) ⭐ NEW

Advanced editing tools for targeted updates to note structure and metadata.

**Tools:**

- `update_frontmatter` - Edit YAML frontmatter with merge/replace modes
- `replace_section` - Replace markdown sections by heading with three modes

### [Session Tools](./session-tools.md)

Development session management with automatic tracking and vault persistence.

**Tools:**

- `start_session` - Start new development session
- `pause_session` - Pause active session
- `resume_session` - Resume paused session
- `end_session` - Complete and archive session
- `get_session_status` - Get current session details
- `add_changelog_entry` - Track changes with conventional commit types
- `get_session_changelog` - View session changelog
- `get_commit_suggestion` - Generate commit messages from changelog
- `add_todo` - Add todos to session
- `update_todo` - Update todo status/priority
- `list_todos` - List session todos with filters

### [Vault Tools](./vault-tools.md)

Intelligent vault organization and analysis tools.

**Tools:**

- `analyze_vault_structure` - Analyze vault content and relationships
- `generate_organization_plan` - Generate plans using presets (clean, minimal, docs-as-code, research)
- `reorganize_vault` - Execute organization plans with link updates

### [Configuration Tools](./config-tools.md)

Setup, validation, and synchronization tools for project configuration.

**Tools:**

- `health_check` - Validate environment and API connection
- `set_project_context` - Set project folder for session
- `setup_notes` - Intelligent documentation setup with 4-phase analysis
- `validate_config` - Validate `.withcontextconfig.jsonc`
- `preview_delegation` - Preview delegation decisions
- `ingest_notes` - Copy docs from project to vault
- `sync_notes` - Bidirectional sync between project and vault
- `teleport_notes` - Copy docs from vault to project

### [Template Tools](./core-tools.md#template-tools)

Create notes from professional templates with variable substitution.

**Tools:**

- `list_templates` - List available templates
- `create_from_template` - Create notes from templates

## Quick Reference

### Most Common Operations

**Writing Documentation:**

```javascript
// Set project context once
set_project_context({ project_folder: 'my-project' });

// Create new documentation
write_note({
  path: 'docs/api.md',
  content: '# API Documentation\n\n...',
  mode: 'create',
});

// Update existing file
write_note({
  path: 'CHANGELOG.md',
  content: '## v2.0.0\n- New features\n',
  mode: 'append',
});
```

**Session Tracking:**

```javascript
// Start session
start_session({
  project_folder: 'my-project',
  message: 'Implementing authentication',
});

// Track changes
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts'],
});

// Generate commit message
get_commit_suggestion({ conventional: true });
```

**Vault Organization:**

```javascript
// Generate organization plan
const plan = generate_organization_plan({
  preset_id: 'clean',
  min_confidence: 0.7,
});

// Preview changes
reorganize_vault({
  plan: plan.plan,
  dry_run: true,
});

// Execute
reorganize_vault({
  plan: plan.plan,
  update_links: true,
});
```

## Tool Selection Guide

### When to Use Each Tool

**For Creating Documentation:**

- New files → `write_note` (mode: 'create')
- From templates → `create_from_template`
- Multiple files → `batch_write_notes`

**For Updating Documentation:**

- Replace entire file → `write_note` (mode: 'overwrite')
- Add to end → `write_note` (mode: 'append')
- Add to beginning → `write_note` (mode: 'prepend')
- Update frontmatter → `update_frontmatter`
- Update specific section → `replace_section`

**For Finding Documentation:**

- List files → `list_notes`
- Fuzzy search by name → `list_notes` (with fuzzy_query)
- Search content → `search_notes`
- Get metadata → `get_note_metadata`

**For Session Management:**

- Start work → `start_session`
- Track changes → `add_changelog_entry`
- Track tasks → `add_todo`
- Generate commits → `get_commit_suggestion`
- End work → `end_session`

**For Vault Organization:**

- Analyze structure → `analyze_vault_structure`
- Plan reorganization → `generate_organization_plan`
- Execute plan → `reorganize_vault`

**For Configuration:**

- Initial setup → `setup_notes`
- Validate config → `validate_config`
- Preview delegation → `preview_delegation`
- Sync files → `sync_notes`

## Common Patterns

### Pattern 1: New Project Setup

```javascript
// 1. Health check
health_check({ project_folder: 'my-project' });

// 2. Intelligent setup
setup_notes({
  project_root: '/path/to/project',
  create_structure: true,
});

// 3. Set context
set_project_context({ project_folder: 'my-project' });

// 4. Start session
start_session({
  project_folder: 'my-project',
  message: 'Initial setup',
});
```

### Pattern 2: Documentation Update Workflow

```javascript
// 1. Read existing content
const content = read_note({ path: 'README.md' });

// 2. Update specific section
replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: 'New installation steps...',
  preview: true, // Preview first
});

// 3. Apply changes
replace_section({
  path: 'README.md',
  heading: 'Installation',
  content: 'New installation steps...',
});

// 4. Update metadata
update_frontmatter({
  path: 'README.md',
  frontmatter: { updated: '2025-11-13' },
  mode: 'merge',
});

// 5. Track change
add_changelog_entry({
  type: 'docs',
  message: 'Update installation instructions',
  files: ['README.md'],
});
```

### Pattern 3: Vault Cleanup

```javascript
// 1. Analyze current state
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
  detect_orphans: true,
});

// 2. Generate organization plan
const plan = generate_organization_plan({
  preset_id: 'clean',
  min_confidence: 0.7,
});

// 3. Preview changes
const preview = reorganize_vault({
  plan: plan.plan,
  dry_run: true,
});

// 4. Execute if satisfied
const result = reorganize_vault({
  plan: plan.plan,
  update_links: true,
  create_backup: true,
});
```

## Error Handling

All tools follow consistent error handling patterns:

```javascript
try {
  const result = await use_tool('write_note', {
    path: 'docs/api.md',
    content: '# API',
    mode: 'create',
  });
} catch (error) {
  // Common error types:
  // - ObsidianApiError: API connection issues
  // - ValidationError: Invalid input
  // - PathSecurityError: Path traversal attempt
  // - ConfigurationError: Missing/invalid config
  // - SessionError: Session state issues
}
```

## Best Practices

### Security

- Always use project-relative paths (never absolute paths)
- Set project context before operations
- Use `health_check` to validate environment

### Performance

- Use `batch_write_notes` for multiple files
- Enable fuzzy search limits for large vaults
- Use dry-run mode before large operations

### Reliability

- Preview changes with `dry_run: true`
- Use `create_backup: true` for risky operations
- Track changes with session tools
- Validate config before syncing

### Organization

- Use consistent naming conventions
- Leverage templates for standard documents
- Use frontmatter for metadata
- Organize with vault presets

## Related Documentation

- [Configuration Guide](../configuration.md) - Setup and configuration
- [Getting Started](../getting-started.md) - Quick start guide
- [Vault Organization](../VAULT_ORGANIZATION.md) - Vault organization details
- [Vault Presets](../VAULT_PRESETS.md) - Organization preset guide
- [Update Frontmatter](../UPDATE_FRONTMATTER.md) - Frontmatter editing guide

## Support

For issues or questions:

- Check tool-specific documentation in this folder
- Review examples in `/examples` directory
- Open an issue on [GitHub](https://github.com/boxpositron/with-context-mcp)
