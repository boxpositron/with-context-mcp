# Examples

Practical usage examples and common workflows for with-context-mcp.

## Available Examples

### [Common Workflows](./common-workflows.md)

Complete, copy-paste examples for common documentation tasks.

**Includes:**

- Daily note creation workflow
- Meeting notes workflow
- Documentation workflow
- Project setup workflow
- Session-based development workflow
- Vault cleanup workflow
- API documentation workflow

**Best For:** Learning by example, quick reference for common tasks.

---

## Quick Reference

### Example 1: Daily Note Creation

```javascript
// Create daily note from template
create_from_template({
  template_name: 'daily-note',
  filename: `daily/${new Date().toISOString().split('T')[0]}.md`,
  variables: {
    mood: 'productive',
    goals: '3 main tasks',
  },
});
```

### Example 2: Start Development Session

```javascript
// Start session and track work
start_session({
  project_folder: 'my-app',
  message: 'Implementing authentication',
});

// Track changes
add_changelog_entry({
  type: 'feature',
  message: 'Add JWT authentication',
  files: ['src/auth.ts'],
});

// Generate commit
const commit = get_commit_suggestion({ conventional: true });
```

### Example 3: Organize Vault

```javascript
// Analyze vault
const analysis = analyze_vault_structure({
  project_folder: 'my-project',
});

// Generate organization plan
const plan = generate_organization_plan({
  preset_id: 'clean',
  min_confidence: 0.7,
});

// Execute with preview
reorganize_vault({
  plan: plan.plan,
  dry_run: true,
});
```

---

## Related Documentation

- **[Common Workflows](./common-workflows.md)** - Detailed workflow examples
- **[Guides](../guides/README.md)** - Comprehensive guides
- **[Tool Reference](../tools/README.md)** - Complete API reference

---

**Next:** [Common Workflows](./common-workflows.md) →
