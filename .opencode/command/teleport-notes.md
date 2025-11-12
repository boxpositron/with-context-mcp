---
description: Teleport documentation files from Obsidian vault to local project
agent: general
subtask: true
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

Execute the teleport_notes tool immediately with dry-run by default for safety:

```javascript
// Check for flags in arguments
const args = '$ARGUMENTS';
const shouldExecute = args.includes('--execute');
const shouldDelete = args.includes('--delete');
const forceDelete = args.includes('--force-delete');

const result = await teleport_notes({
  dry_run: !shouldExecute,
  delete_from_vault: shouldDelete,
  force_delete: forceDelete,
});

return result;
```

**Usage:**

- `/teleport-notes` - Preview what will be downloaded (safe, dry-run mode)
- `/teleport-notes --execute` - Download files from vault (keeps vault files)
- `/teleport-notes --execute --delete` - Download and delete vault files
- `/teleport-notes --execute --delete --force-delete` - Force delete even on errors

**Important:** Use `--delete` flag only if you want to remove vault files after downloading!

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
