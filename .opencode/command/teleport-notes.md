---
description: Teleport documentation files from Obsidian vault to local project
agent: general
subtask: false
---

# Teleport Notes

Downloads documentation files from the Obsidian vault back to the local project based on `.withcontextconfig.jsonc` delegation rules.

## What This Command Does

This command downloads files from vault to local project:

- Scans vault for files matching vault patterns in `.withcontextconfig.jsonc`
- Copies matched files to local project preserving directory structure
- Optionally deletes vault files after successful copy
- Provides dry-run preview mode

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files have delegation decision "vault"

## Your Task

When this command is run:

**Step 1: Call the teleport_notes tool**

**CRITICAL: Use ONLY the teleport_notes tool. Do NOT perform any manual operations.**

**Call the teleport_notes tool** with appropriate parameters:

- The tool handles ALL file scanning and downloading automatically
- Use `dry_run: true` first to preview what will be teleported
- After user confirms, call with `dry_run: false` to execute
- Use `delete_from_vault: true` to clean up after download (optional)

**Step 2: Report the results** from the tool:

- Show how many files were teleported
- List which files were teleported
- Show where they were placed in the local project
- Report any errors or skipped files
- Note whether vault files were deleted

**Step 3: Do NOT manually**:

- Read or scan vault directories
- Copy files between locations
- Delete vault files
- Parse `.withcontextconfig.jsonc`
- The teleport_notes tool does ALL of this automatically

**Tool Priority:**
First try to use the WithContext plugin's `teleport_notes` tool. If not available, fallback to the with-context MCP server's `teleport_notes` tool.

**Example usage:**

```javascript
// Preview what will be teleported (always do this first!)
teleport_notes({
  project_folder: 'my-project',
  dry_run: true,
});

// Execute download after user confirms (do NOT delete vault files by default)
teleport_notes({
  project_folder: 'my-project',
  dry_run: false,
  delete_from_vault: false, // Keep vault files (default)
});

// Execute with cleanup (only if user explicitly requests)
teleport_notes({
  project_folder: 'my-project',
  dry_run: false,
  delete_from_vault: true, // Delete vault files after successful copy
  force_delete: true, // Force deletion even if some files had errors
});
```

## Parameters

### dry_run (optional, default: false)

Preview mode - shows what will happen without making changes:

```javascript
dry_run: true; // Preview only
dry_run: false; // Execute for real
```

### delete_from_vault (optional, default: false)

Whether to delete vault files after successful copy to local:

```javascript
delete_from_vault: false; // Keep vault files (default)
delete_from_vault: true; // Delete vault files after copy
```

### force_delete (optional, default: false)

Force deletion of vault files even if some files had errors:

```javascript
force_delete: false; // Don't delete if errors occurred (default)
force_delete: true; // Delete even if some files failed
```

## Important Notes

- **Vault files are NOT deleted by default** - set `delete_from_vault: true` explicitly if desired
- **Always preview first** - Use `dry_run: true` before executing
- **The tool automatically checks** for `.withcontextconfig.jsonc` existence
- **Directory structure is preserved** in the local project

## Example Output

```
=== Teleport Results ===

Files teleported from vault: 15
  - docs/guides/getting-started.md → docs/guides/getting-started.md
  - docs/architecture/decisions/001-use-typescript.md → docs/architecture/decisions/001-use-typescript.md
  - CHANGELOG.md → CHANGELOG.md
  ... (12 more files)

Vault files deleted: 0 (kept in vault)
Errors: 0
```

## Related Commands

- `/setup-notes` - Create configuration file
- `/preview-notes-delegation` - Preview which files will be teleported
- `/sync-notes` - Bidirectional sync (moves files both ways)
- `/ingest-notes` - One-way copy to vault
- `/validate-notes-config` - Validate configuration

---

_The teleport-notes tool downloads vault documentation to local project based on delegation rules._
