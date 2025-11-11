---
description: Ingest local documentation files to Obsidian vault
agent: general
subtask: false
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

When this command is run:

**Step 1: Call the ingest_notes tool**

**CRITICAL: Use ONLY the ingest_notes tool. Do NOT perform any manual operations.**

Call the `ingest_notes` tool directly. The tool will:

- Auto-detect project from git context
- Scan for files with "vault" delegation decision
- Copy files from local to vault
- Optionally delete local files after copy
- Return formatted results

```javascript
// Preview first (recommended)
const preview = await ingest_notes({
  dry_run: true, // Preview only
});

// Display preview and STOP
return preview;

// Execute (separate command invocation)
const result = await ingest_notes({
  dry_run: false, // Execute for real
  delete_local_files: false, // Keep local files (default)
});

// Or with cleanup (if user explicitly requests)
const result = await ingest_notes({
  dry_run: false,
  delete_local_files: true, // Delete after copy
  force_delete: true, // Force delete even if errors
});

// Display results
return result;
```

**Step 2: Do NOT manually**:

- Scan directories or read files
- Copy files to vault
- Delete local files
- Parse configuration
- The tool handles ALL of this automatically

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
