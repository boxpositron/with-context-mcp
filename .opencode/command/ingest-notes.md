---
description: Ingest local documentation files to Obsidian vault
agent: general
subtask: true
---

# Ingest Notes

Scans the current project for documentation files based on `.withcontextconfig.jsonc` delegation rules and copies them to the Obsidian vault.

## What This Command Does

This command copies documentation files from your local project to the Obsidian vault:

- Scans project for files matching vault patterns in `.withcontextconfig.jsonc`
- Copies matched files to vault preserving directory structure
- Optionally deletes local files after successful copy
- Provides dry-run preview mode

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files have delegation decision "vault"

## Your Task

Execute the ingest_notes tool immediately with dry-run by default for safety:

```javascript
// Check for flags in arguments
const args = '$ARGUMENTS';
const shouldExecute = args.includes('--execute');
const shouldDelete = args.includes('--delete');
const forceDelete = args.includes('--force-delete');

const result = await ingest_notes({
  dry_run: !shouldExecute,
  delete_local_files: shouldDelete,
  force_delete: forceDelete,
});

return result;
```

**Usage:**

- `/ingest-notes` - Preview what will be copied (safe, dry-run mode)
- `/ingest-notes --execute` - Copy files to vault (keeps local files)
- `/ingest-notes --execute --delete` - Copy and delete local files
- `/ingest-notes --execute --delete --force-delete` - Force delete even on errors

**Important:** Use `--delete` flag only if you want to remove local files after copying!

## Parameters

### dry_run (optional, default: false)

Preview mode - shows what will happen without making changes:

```javascript
dry_run: true; // Preview only
dry_run: false; // Execute for real
```

### delete_local_files (optional, default: false)

Whether to delete local files after successful copy to vault:

```javascript
delete_local_files: false; // Keep local files (default)
delete_local_files: true; // Delete local files after copy
```

### force_delete (optional, default: false)

Force deletion of local files even if some files had errors:

```javascript
force_delete: false; // Don't delete if errors occurred (default)
force_delete: true; // Delete even if some files failed
```

## Important Notes

- **Local files are NOT deleted by default** - set `delete_local_files: true` explicitly if desired
- **Always preview first** - Use `dry_run: true` before executing
- **The tool automatically checks** for `.withcontextconfig.jsonc` existence
- **Directory structure is preserved** in the vault

## Related Commands

- `/setup-notes` - Create configuration file
- `/preview-notes-delegation` - Preview which files will be ingested
- `/sync-notes` - Bidirectional sync (moves files both ways)
- `/validate-notes-config` - Validate configuration

---

_The ingest-notes tool copies local documentation to vault based on delegation rules._
